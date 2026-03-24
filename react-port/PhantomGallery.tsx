"use client";

import type { CSSProperties } from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Preload } from "@react-three/drei";
import * as THREE from "three";

type MediaType = "image" | "video";

type ProjectMedia = {
  type: MediaType;
  src: string;
};

export type PhantomGalleryProject = {
  title: string;
  year: number;
  href?: string;
  media: ProjectMedia;
};

type PhantomGalleryProps = {
  className?: string;
  style?: CSSProperties;
  projects?: PhantomGalleryProject[];
  dpr?: number | [number, number];
  showOverlays?: boolean;
  uiBlockSelector?: string;
  onProjectSelect?: (project: PhantomGalleryProject, index: number) => void;
};

type GalleryResources = {
  orderedProjects: PhantomGalleryProject[];
  imageCount: number;
  videoCount: number;
  imageAtlas: THREE.Texture;
  textAtlas: THREE.Texture;
  videoSlots: [THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture];
};

type GalleryUniforms = {
  uOffset: { value: THREE.Vector2 };
  uResolution: { value: THREE.Vector2 };
  uBorderColor: { value: THREE.Vector4 };
  uHoverColor: { value: THREE.Vector4 };
  uBackgroundColor: { value: THREE.Vector4 };
  uMousePos: { value: THREE.Vector2 };
  uZoom: { value: number };
  uCellSize: { value: THREE.Vector2 };
  uTextureCount: { value: number };
  uImageCount: { value: number };
  uVideoCount: { value: number };
  uImageAtlas: { value: THREE.Texture };
  uTextAtlas: { value: THREE.Texture };
  uVideo0: { value: THREE.Texture };
  uVideo1: { value: THREE.Texture };
  uVideo2: { value: THREE.Texture };
  uVideo3: { value: THREE.Texture };
};

type InteractionState = {
  isDragging: boolean;
  isClick: boolean;
  clickStartTime: number;
  previousMouse: THREE.Vector2;
  offset: THREE.Vector2;
  targetOffset: THREE.Vector2;
  mousePosition: THREE.Vector2;
  zoomLevel: number;
  targetZoom: number;
  zoomTimeout: number | null;
};

const FONT_FAMILY = "PP Neue Montreal";
const ATLAS_TILE_SIZE = 512;
const ATLAS_PADDING = 16;

const CONFIG = {
  cellSize: { x: 0.85, y: 0.66 },
  zoomLevel: 1.25,
  lerpFactor: 0.075,
  borderColor: "rgba(255, 255, 255, 0.15)",
  backgroundColor: "rgba(0, 0, 0, 1)",
  textColor: "rgba(128, 128, 128, 1)",
  hoverColor: "rgba(255, 255, 255, 0)",
};

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec2 uOffset;
  uniform vec2 uResolution;
  uniform vec4 uBorderColor;
  uniform vec4 uHoverColor;
  uniform vec4 uBackgroundColor;
  uniform vec2 uMousePos;
  uniform float uZoom;
  uniform vec2 uCellSize;
  uniform float uTextureCount;
  uniform float uImageCount;
  uniform float uVideoCount;
  uniform sampler2D uImageAtlas;
  uniform sampler2D uTextAtlas;
  uniform sampler2D uVideo0;
  uniform sampler2D uVideo1;
  uniform sampler2D uVideo2;
  uniform sampler2D uVideo3;
  varying vec2 vUv;

  void main() {
    float atlasInset = 16.0 / 512.0;
    vec2 screenUV = (vUv - 0.5) * 2.0;

    float radius = length(screenUV);
    float distortion = 1.0 - 0.08 * radius * radius;
    vec2 distortedUV = screenUV * distortion;

    vec2 aspectRatio = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 worldCoord = distortedUV * aspectRatio;

    worldCoord *= uZoom;
    worldCoord += uOffset;

    vec2 cellPos = worldCoord / uCellSize;
    vec2 cellId = floor(cellPos);
    vec2 cellUV = fract(cellPos);

    vec2 mouseScreenUV = (uMousePos / uResolution) * 2.0 - 1.0;
    mouseScreenUV.y = -mouseScreenUV.y;

    float mouseRadius = length(mouseScreenUV);
    float mouseDistortion = 1.0 - 0.08 * mouseRadius * mouseRadius;
    vec2 mouseDistortedUV = mouseScreenUV * mouseDistortion;
    vec2 mouseWorldCoord = mouseDistortedUV * aspectRatio;

    mouseWorldCoord *= uZoom;
    mouseWorldCoord += uOffset;

    vec2 mouseCellPos = mouseWorldCoord / uCellSize;
    vec2 mouseCellId = floor(mouseCellPos);

    vec2 cellCenter = cellId + 0.5;
    vec2 mouseCellCenter = mouseCellId + 0.5;
    float cellDistance = length(cellCenter - mouseCellCenter);
    float hoverIntensity = 1.0 - smoothstep(0.4, 0.7, cellDistance);
    bool isHovered = hoverIntensity > 0.0 && uMousePos.x >= 0.0;

    vec3 backgroundColor = uBackgroundColor.rgb;
    if (isHovered) {
      backgroundColor = mix(uBackgroundColor.rgb, uHoverColor.rgb, hoverIntensity * uHoverColor.a);
    }

    float lineWidth = 0.005;
    float gridX = smoothstep(0.0, lineWidth, cellUV.x) * smoothstep(0.0, lineWidth, 1.0 - cellUV.x);
    float gridY = smoothstep(0.0, lineWidth, cellUV.y) * smoothstep(0.0, lineWidth, 1.0 - cellUV.y);
    float gridMask = gridX * gridY;

    vec2 imageSize = vec2(0.78, 0.52);
    vec2 imageBorder = (1.0 - imageSize) * 0.5;

    vec2 imageUV = (cellUV - imageBorder) / imageSize;

    float edgeSmooth = 0.01;
    vec2 imageMask = smoothstep(-edgeSmooth, edgeSmooth, imageUV) *
                    smoothstep(-edgeSmooth, edgeSmooth, 1.0 - imageUV);
    float imageAlpha = imageMask.x * imageMask.y;

    bool inImageArea = imageUV.x >= 0.0 && imageUV.x <= 1.0 && imageUV.y >= 0.0 && imageUV.y <= 1.0;

    bool inTextArea = false;

    float texIndex = mod(cellId.x + cellId.y * 3.0, max(uTextureCount, 1.0));
    if (texIndex < 0.0) {
      texIndex += uTextureCount;
    }
    texIndex = floor(texIndex + 0.0001);

    vec3 color = backgroundColor;

    if (inImageArea && imageAlpha > 0.0) {
      if (texIndex >= uImageCount) {
        float videoIndex = texIndex - uImageCount;
        videoIndex = mod(videoIndex, max(uVideoCount, 1.0));
        vec3 videoColor = texture2D(uVideo3, imageUV).rgb;

        if (videoIndex < 0.5) {
          videoColor = texture2D(uVideo0, imageUV).rgb;
        } else if (videoIndex < 1.5) {
          videoColor = texture2D(uVideo1, imageUV).rgb;
        } else if (videoIndex < 2.5) {
          videoColor = texture2D(uVideo2, imageUV).rgb;
        }

        color = mix(color, videoColor, imageAlpha);
      } else {
        float atlasSize = ceil(sqrt(uImageCount + 0.001));
        vec2 atlasPos = vec2(mod(texIndex, atlasSize), floor(texIndex / atlasSize));
        vec2 paddedImageUV = mix(vec2(atlasInset), vec2(1.0 - atlasInset), imageUV);
        vec2 atlasSampleUV = vec2(paddedImageUV.x, 1.0 - paddedImageUV.y);
        vec2 atlasUV = (atlasPos + atlasSampleUV) / atlasSize;

        vec3 imageColor = texture2D(uImageAtlas, atlasUV).rgb;
        color = mix(color, imageColor, imageAlpha);
      }
    }

    if (inTextArea) {
      vec2 textCoord = vec2(0.0);
      textCoord.y = 1.0 - textCoord.y;

      float atlasSize = ceil(sqrt(uTextureCount + 0.001));
      vec2 atlasPos = vec2(mod(texIndex, atlasSize), floor(texIndex / atlasSize));
      vec2 paddedTextUV = mix(vec2(atlasInset), vec2(1.0 - atlasInset), textCoord);
      vec2 atlasUV = (atlasPos + paddedTextUV) / atlasSize;

      vec4 textColor = texture2D(uTextAtlas, atlasUV);

      vec3 textBgColor = backgroundColor;
      color = mix(textBgColor, textColor.rgb, textColor.a);
    }

    vec3 borderRGB = uBorderColor.rgb;
    float borderAlpha = uBorderColor.a;
    color = mix(color, borderRGB, (1.0 - gridMask) * borderAlpha);

    float fade = 1.0 - smoothstep(1.2, 1.8, radius);

    gl_FragColor = vec4(color * fade, 1.0);
  }
`;

export const defaultPhantomProjects: PhantomGalleryProject[] = [
  {
    title: "Find",
    media: { type: "image", src: "/img1.webp" },
    year: 2025,
    href: "https://findrealestate.com/",
  },
  {
    title: "Waabi",
    media: { type: "image", src: "/img2.webp" },
    year: 2025,
    href: "https://waabi.ai/",
  },
  {
    title: "MetaMask",
    media: { type: "image", src: "/img3.webp" },
    year: 2025,
    href: "https://metamask.io/tr",
  },
  {
    title: "Aykanat Far",
    media: { type: "image", src: "/img4.webp" },
    year: 2025,
    href: "https://www.aykanatotomotiv.com/",
  },
  {
    title: "Klinik Prime",
    media: { type: "image", src: "/img5.webp" },
    year: 2025,
    href: "https://www.klinikprimemaltepe.com/",
  },
  {
    title: "Aether",
    media: { type: "image", src: "/img6.webp" },
    year: 2025,
    href: "https://aetherapparel.com/",
  },
  {
    title: "Terrene",
    media: { type: "image", src: "/img7.webp" },
    year: 2025,
    href: "/terrene",
  },
  {
    title: "Nrmlss",
    media: { type: "image", src: "/img8.webp" },
    year: 2025,
    href: "/nrmlss",
  },
  {
    title: "Polite Chaos",
    media: { type: "image", src: "/img9.webp" },
    year: 2025,
    href: "/polite-chaos",
  },
];

function rgbaToArray(rgba: string): [number, number, number, number] {
  const match = rgba.match(/rgba?\(([^)]+)\)/);
  if (!match) return [1, 1, 1, 1];

  const [r = "255", g = "255", b = "255", a = "1"] = match[1].split(",");
  return [
    parseFloat(r.trim()) / 255,
    parseFloat(g.trim()) / 255,
    parseFloat(b.trim()) / 255,
    parseFloat(a.trim()),
  ];
}

function getMedia(project: PhantomGalleryProject): ProjectMedia {
  return project.media;
}

function isImage(project: PhantomGalleryProject) {
  return getMedia(project).type === "image";
}

function isVideo(project: PhantomGalleryProject) {
  return getMedia(project).type === "video";
}

function ensureFontsReady() {
  if (typeof document !== "undefined" && document.fonts?.load) {
    return document.fonts.load(`112px "${FONT_FAMILY}"`);
  }

  return Promise.resolve();
}

function createTextTexture(title: string, year: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return createSolidTexture([0, 0, 0, 0]);
  }

  ctx.clearRect(0, 0, 2048, 256);
  ctx.font = `44px "${FONT_FAMILY}"`;
  ctx.fillStyle = CONFIG.textColor;
  ctx.textBaseline = "middle";
  ctx.imageSmoothingEnabled = false;

  ctx.textAlign = "left";
  ctx.fillText(title.toUpperCase(), 44, 128);
  ctx.textAlign = "right";
  ctx.fillText(year.toString().toUpperCase(), 2048 - 44, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function createSolidTexture(color: [number, number, number, number] = [0, 0, 0, 255]) {
  const texture = new THREE.DataTexture(new Uint8Array(color), 1, 1);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

function createVideoTexture(src: string) {
  const video = document.createElement("video");
  video.src = src;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.play().catch(() => undefined);

  const texture = new THREE.VideoTexture(video);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function createTextureAtlas(textures: THREE.Texture[], isText = false) {
  if (!textures.length) {
    return createSolidTexture();
  }

  const atlasSize = Math.ceil(Math.sqrt(textures.length));
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = atlasSize * ATLAS_TILE_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return createSolidTexture();
  }

  if (isText) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const totalSlots = atlasSize * atlasSize;
  for (let index = 0; index < totalSlots; index += 1) {
    const texture = textures[index % textures.length];
    const x = (index % atlasSize) * ATLAS_TILE_SIZE;
    const y = Math.floor(index / atlasSize) * ATLAS_TILE_SIZE;
    const innerSize = ATLAS_TILE_SIZE - ATLAS_PADDING * 2;
    const drawX = x + ATLAS_PADDING;
    const drawY = y + ATLAS_PADDING;

    if (isText) {
      const source = texture.source?.data;
      if (source) {
        ctx.drawImage(
          source as CanvasImageSource,
          drawX,
          drawY,
          innerSize,
          innerSize
        );
      }
      continue;
    }

    const image = texture.image as HTMLImageElement | undefined;
    if (image?.complete) {
      ctx.drawImage(image, drawX, drawY, innerSize, innerSize);
    }
  }

  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
  atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
  atlasTexture.minFilter = THREE.LinearFilter;
  atlasTexture.magFilter = THREE.LinearFilter;
  atlasTexture.flipY = false;
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.generateMipmaps = false;
  atlasTexture.needsUpdate = true;

  return atlasTexture;
}

async function loadImageTextures(srcList: string[]) {
  const loader = new THREE.TextureLoader();
  const textures = await Promise.all(srcList.map((src) => loader.loadAsync(src)));

  textures.forEach((texture) => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
  });

  return textures;
}

function disposeTexture(texture: THREE.Texture) {
  if (texture instanceof THREE.VideoTexture) {
    const video = texture.image as HTMLVideoElement | undefined;
    video?.pause();

    if (video) {
      video.removeAttribute("src");
      video.load();
    }
  }

  texture.dispose();
}

function getClientPosition(event: MouseEvent | TouchEvent) {
  if ("changedTouches" in event && event.changedTouches.length > 0) {
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
  }

  if ("touches" in event && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  return {
    x: (event as MouseEvent).clientX,
    y: (event as MouseEvent).clientY,
  };
}

function useGalleryResources(projects: PhantomGalleryProject[]) {
  const [resources, setResources] = useState<GalleryResources | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => undefined;

    const load = async () => {
      const orderedProjects = [
        ...projects.filter(isImage),
        ...projects.filter(isVideo),
      ];
      const imageProjects = orderedProjects.filter(isImage);
      const videoProjects = orderedProjects.filter(isVideo);

      await ensureFontsReady();

      const textTextures = orderedProjects.map((project) =>
        createTextTexture(project.title, project.year)
      );
      const imageTextures = await loadImageTextures(
        imageProjects.map((project) => getMedia(project).src)
      );

      const imageAtlas = createTextureAtlas(imageTextures, false);
      const textAtlas = createTextureAtlas(textTextures, true);
      const videoTextures = videoProjects.map((project) =>
        createVideoTexture(getMedia(project).src)
      );
      const fallbackVideo = createSolidTexture([0, 0, 0, 255]);
      const videoSlots: [THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture] = [
        videoTextures[0] || fallbackVideo,
        videoTextures[1] || fallbackVideo,
        videoTextures[2] || fallbackVideo,
        videoTextures[3] || fallbackVideo,
      ];

      cleanup = () => {
        imageTextures.forEach((texture) => texture.dispose());
        textTextures.forEach((texture) => texture.dispose());
        imageAtlas.dispose();
        textAtlas.dispose();
        videoTextures.forEach(disposeTexture);
        fallbackVideo.dispose();
      };

      if (cancelled) {
        cleanup();
        return;
      }

      setResources({
        orderedProjects,
        imageCount: imageProjects.length,
        videoCount: videoProjects.length,
        imageAtlas,
        textAtlas,
        videoSlots,
      });
    };

    load().catch(() => {
      if (!cancelled) {
        setResources(null);
      }
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [projects]);

  return resources;
}

function createUniforms(blankTexture: THREE.Texture): GalleryUniforms {
  return {
    uOffset: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uBorderColor: { value: new THREE.Vector4(...rgbaToArray(CONFIG.borderColor)) },
    uHoverColor: { value: new THREE.Vector4(...rgbaToArray(CONFIG.hoverColor)) },
    uBackgroundColor: {
      value: new THREE.Vector4(...rgbaToArray(CONFIG.backgroundColor)),
    },
    uMousePos: { value: new THREE.Vector2(-1, -1) },
    uZoom: { value: 1 },
    uCellSize: { value: new THREE.Vector2(CONFIG.cellSize.x, CONFIG.cellSize.y) },
    uTextureCount: { value: 0 },
    uImageCount: { value: 0 },
    uVideoCount: { value: 0 },
    uImageAtlas: { value: blankTexture },
    uTextAtlas: { value: blankTexture },
    uVideo0: { value: blankTexture },
    uVideo1: { value: blankTexture },
    uVideo2: { value: blankTexture },
    uVideo3: { value: blankTexture },
  };
}

function PhantomGalleryScene({
  projects,
  uiBlockSelector,
  onProjectSelect,
}: Required<Pick<PhantomGalleryProps, "projects" | "uiBlockSelector">> &
  Pick<PhantomGalleryProps, "onProjectSelect">) {
  const { gl, size } = useThree();
  const resources = useGalleryResources(projects);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const blankTextureRef = useRef<THREE.Texture | null>(null);
  const uniformsRef = useRef<GalleryUniforms | null>(null);
  const interactionRef = useRef<InteractionState>({
    isDragging: false,
    isClick: true,
    clickStartTime: 0,
    previousMouse: new THREE.Vector2(),
    offset: new THREE.Vector2(),
    targetOffset: new THREE.Vector2(),
    mousePosition: new THREE.Vector2(-1, -1),
    zoomLevel: 1,
    targetZoom: 1,
    zoomTimeout: null,
  });

  if (!blankTextureRef.current) {
    blankTextureRef.current = createSolidTexture([0, 0, 0, 255]);
  }

  if (!uniformsRef.current) {
    uniformsRef.current = createUniforms(blankTextureRef.current);
  }

  useEffect(() => {
    return () => {
      blankTextureRef.current?.dispose();
      if (interactionRef.current.zoomTimeout !== null) {
        window.clearTimeout(interactionRef.current.zoomTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const bgColor = rgbaToArray(CONFIG.backgroundColor);
    gl.setClearColor(new THREE.Color(bgColor[0], bgColor[1], bgColor[2]), bgColor[3]);
  }, [gl]);

  useEffect(() => {
    uniformsRef.current?.uResolution.value.set(size.width, size.height);
  }, [size.height, size.width]);

  useEffect(() => {
    if (!resources || !uniformsRef.current) return;

    uniformsRef.current.uTextureCount.value = resources.orderedProjects.length;
    uniformsRef.current.uImageCount.value = resources.imageCount;
    uniformsRef.current.uVideoCount.value = resources.videoCount;
    uniformsRef.current.uImageAtlas.value = resources.imageAtlas;
    uniformsRef.current.uTextAtlas.value = resources.textAtlas;
    uniformsRef.current.uVideo0.value = resources.videoSlots[0];
    uniformsRef.current.uVideo1.value = resources.videoSlots[1];
    uniformsRef.current.uVideo2.value = resources.videoSlots[2];
    uniformsRef.current.uVideo3.value = resources.videoSlots[3];

    if (materialRef.current) {
      materialRef.current.needsUpdate = true;
    }
  }, [resources]);

  useEffect(() => {
    if (!resources) return;

    const interaction = interactionRef.current;
    const uniforms = uniformsRef.current;
    if (!uniforms) return;

    const isUiTarget = (target: EventTarget | null) => {
      if (!uiBlockSelector) return false;
      return target instanceof Element ? Boolean(target.closest(uiBlockSelector)) : false;
    };

    const resetMouse = () => {
      interaction.mousePosition.set(-1, -1);
      uniforms.uMousePos.value.set(-1, -1);
    };

    const updateMousePosition = (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      interaction.mousePosition.set(clientX - rect.left, clientY - rect.top);
      uniforms.uMousePos.value.copy(interaction.mousePosition);
    };

    const startDrag = (x: number, y: number) => {
      interaction.isDragging = true;
      interaction.isClick = true;
      interaction.clickStartTime = Date.now();
      interaction.previousMouse.set(x, y);
      document.body.classList.add("dragging");

      if (interaction.zoomTimeout !== null) {
        window.clearTimeout(interaction.zoomTimeout);
      }

      interaction.zoomTimeout = window.setTimeout(() => {
        if (interaction.isDragging) {
          interaction.targetZoom = CONFIG.zoomLevel;
        }
      }, 150);
    };

    const handleMove = (x: number, y: number) => {
      if (!interaction.isDragging) return;

      const deltaX = x - interaction.previousMouse.x;
      const deltaY = y - interaction.previousMouse.y;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        interaction.isClick = false;
        if (interaction.targetZoom === 1) {
          interaction.targetZoom = CONFIG.zoomLevel;
        }
      }

      interaction.targetOffset.x -= deltaX * 0.003;
      interaction.targetOffset.y += deltaY * 0.003;
      interaction.previousMouse.set(x, y);
    };

    const selectProject = (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const screenX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const screenY = -(((clientY - rect.top) / rect.height) * 2 - 1);
      const radius = Math.sqrt(screenX * screenX + screenY * screenY);
      const distortion = 1 - 0.08 * radius * radius;

      const worldX =
        screenX * distortion * (rect.width / rect.height) * interaction.zoomLevel +
        interaction.offset.x;
      const worldY = screenY * distortion * interaction.zoomLevel + interaction.offset.y;

      const cellX = Math.floor(worldX / CONFIG.cellSize.x);
      const cellY = Math.floor(worldY / CONFIG.cellSize.y);
      const textureCount = Math.max(resources.orderedProjects.length, 1);
      const texIndex = Math.floor((cellX + cellY * 3) % textureCount);
      const actualIndex = texIndex < 0 ? textureCount + texIndex : texIndex;
      const project = resources.orderedProjects[actualIndex];

      if (!project) return;

      if (onProjectSelect) {
        onProjectSelect(project, actualIndex);
        return;
      }

      if (project.href) {
        window.location.href = project.href;
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (isUiTarget(event.target)) return;
      startDrag(event.clientX, event.clientY);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isUiTarget(event.target)) return;
      event.preventDefault();

      const position = getClientPosition(event);
      startDrag(position.x, position.y);
    };

    const onMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      const position = getClientPosition(event);
      handleMove(position.x, position.y);
    };

    const onPointerUp = (event: MouseEvent | TouchEvent) => {
      const uiTarget = isUiTarget(event.target);
      if (uiTarget && !interaction.isDragging) return;

      interaction.isDragging = false;
      interaction.targetZoom = 1;
      document.body.classList.remove("dragging");

      if (interaction.zoomTimeout !== null) {
        window.clearTimeout(interaction.zoomTimeout);
        interaction.zoomTimeout = null;
      }

      if (uiTarget) return;

      if (interaction.isClick && Date.now() - interaction.clickStartTime < 200) {
        const position = getClientPosition(event);
        selectProject(position.x, position.y);
      }
    };

    const onContextMenu = (event: Event) => {
      event.preventDefault();
    };

    const mouseMoveOnCanvas = (event: MouseEvent) => {
      updateMousePosition(event.clientX, event.clientY);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onPointerUp as EventListener);
    document.addEventListener("mouseleave", onPointerUp as EventListener);

    document.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onPointerUp as EventListener, {
      passive: false,
    });

    document.addEventListener("contextmenu", onContextMenu);
    gl.domElement.addEventListener("mousemove", mouseMoveOnCanvas);
    gl.domElement.addEventListener("mouseleave", resetMouse);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onPointerUp as EventListener);
      document.removeEventListener("mouseleave", onPointerUp as EventListener);

      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onPointerUp as EventListener);

      document.removeEventListener("contextmenu", onContextMenu);
      gl.domElement.removeEventListener("mousemove", mouseMoveOnCanvas);
      gl.domElement.removeEventListener("mouseleave", resetMouse);
      document.body.classList.remove("dragging");
    };
  }, [gl.domElement, onProjectSelect, resources, uiBlockSelector]);

  useFrame(() => {
    const interaction = interactionRef.current;
    const uniforms = uniformsRef.current;
    if (!uniforms) return;

    interaction.offset.lerp(interaction.targetOffset, CONFIG.lerpFactor);
    interaction.zoomLevel = THREE.MathUtils.lerp(
      interaction.zoomLevel,
      interaction.targetZoom,
      CONFIG.lerpFactor
    );

    uniforms.uOffset.value.copy(interaction.offset);
    uniforms.uZoom.value = interaction.zoomLevel;
  });

  if (!resources) {
    return null;
  }

  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 1]} near={0.1} far={10} />
      <mesh frustumCulled={false}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniformsRef.current}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
      <Preload all />
    </>
  );
}

const wrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  background: "#000",
  overflow: "hidden",
};

const canvasStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

const cornerBlurStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backdropFilter: "blur(9px)",
  WebkitBackdropFilter: "blur(9px)",
  maskImage: "radial-gradient(circle at center, transparent 55%, black 100%)",
  WebkitMaskImage:
    "radial-gradient(circle at center, transparent 55%, black 100%)",
};

const vignetteStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.22) 70%, rgba(0, 0, 0, 0.42) 100%)",
};

export default function PhantomGallery({
  className,
  style,
  projects = defaultPhantomProjects,
  dpr = [1, 2],
  showOverlays = true,
  uiBlockSelector = ".menu-drawer, .menu-drop-zone",
  onProjectSelect,
}: PhantomGalleryProps) {
  return (
    <div className={className} style={{ ...wrapperStyle, ...style }}>
      <Canvas
        orthographic
        dpr={dpr}
        gl={{ antialias: true, alpha: false }}
        style={canvasStyle}
      >
        <Suspense fallback={null}>
          <PhantomGalleryScene
            projects={projects}
            uiBlockSelector={uiBlockSelector}
            onProjectSelect={onProjectSelect}
          />
        </Suspense>
      </Canvas>

      {showOverlays ? (
        <>
          <div style={cornerBlurStyle} />
          <div style={vignetteStyle} />
        </>
      ) : null}
    </div>
  );
}

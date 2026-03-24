export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform vec2 uOffset;
  uniform vec2 uResolution;
  uniform vec4 uBorderColor;
  uniform vec4 uHoverColor;
  uniform vec4 uBackgroundColor;
  uniform vec2 uMousePos;
  uniform float uZoom;
  uniform vec2 uCellSize;
  uniform float uTextureCount;
  uniform sampler2D uImage0;
  uniform sampler2D uImage1;
  uniform sampler2D uImage2;
  uniform sampler2D uImage3;
  uniform sampler2D uImage4;
  uniform sampler2D uImage5;
  uniform sampler2D uImage6;
  uniform sampler2D uImage7;
  uniform sampler2D uImage8;
  uniform sampler2D uTextAtlas;
  varying vec2 vUv;

  vec4 sampleImage(float index, vec2 uv) {
    if (index < 0.5) return texture2D(uImage0, uv);
    if (index < 1.5) return texture2D(uImage1, uv);
    if (index < 2.5) return texture2D(uImage2, uv);
    if (index < 3.5) return texture2D(uImage3, uv);
    if (index < 4.5) return texture2D(uImage4, uv);
    if (index < 5.5) return texture2D(uImage5, uv);
    if (index < 6.5) return texture2D(uImage6, uv);
    if (index < 7.5) return texture2D(uImage7, uv);
    return texture2D(uImage8, uv);
  }
  
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
      vec3 imageColor = sampleImage(texIndex, imageUV).rgb;
      color = mix(color, imageColor, imageAlpha);
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

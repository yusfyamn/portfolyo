"use client";
import "./work.css";

import AnimatedH1 from "../components/AnimatedH1/AnimatedH1";
import AnimatedCopy from "../components/AnimatedCopy/AnimatedCopy";
import ParallaxImage from "../components/ParallaxImage/ParallaxImage";
import Footer from "../components/Footer/Footer";

import { ReactLenis } from "@studio-freight/react-lenis";
import { useTransitionRouter } from "next-view-transitions";
import { withBasePath } from "@/lib/basePath";

const Page = () => {
  const router = useTransitionRouter();

  const projectsData = [
    {
      id: 1,
      name: "Horizon Branding",
      imageUrl: "/isochrome/projects/project-banner-1.jpg",
    },
    {
      id: 2,
      name: "Pulse Digital",
      imageUrl: "/isochrome/projects/project-banner-2.jpg",
    },
    {
      id: 3,
      name: "Elevate Studios",
      imageUrl: "/isochrome/projects/project-banner-3.jpg",
    },
    {
      id: 4,
      name: "Nova Marketing",
      imageUrl: "/isochrome/projects/project-banner-4.jpg",
    },
    {
      id: 5,
      name: "Catalyst Media",
      imageUrl: "/isochrome/projects/project-banner-5.jpg",
    },
    {
      id: 6,
      name: "Spectrum Design",
      imageUrl: "/isochrome/projects/project-banner-6.jpg",
    },
    {
      id: 7,
      name: "Vertex Creative",
      imageUrl: "/isochrome/projects/project-banner-7.jpg",
    },
  ];

  function slideInOut() {
    document.documentElement.animate(
      [
        {
          opacity: 1,
          transform: "scale(1)",
        },
        {
          opacity: 0.4,
          transform: "scale(0.5)",
        },
      ],
      {
        duration: 1500,
        easing: "cubic-bezier(0.87, 0, 0.13, 1)",
        fill: "forwards",
        pseudoElement: "::view-transition-old(root)",
      }
    );

    document.documentElement.animate(
      [
        {
          clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
        },
        {
          clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
        },
      ],
      {
        duration: 1500,
        easing: "cubic-bezier(0.87, 0, 0.13, 1)",
        fill: "forwards",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }

  const handleNavigation = (e, path) => {
    e.preventDefault();

    setTimeout(() => {
      router.push(path, {
        onTransitionReady: slideInOut,
      });
    }, 200);
  };

  return (
    <ReactLenis root>
      <div className="page">
        <section className="work-hero">
          <div className="container">
            <AnimatedH1 delay={1}>From vision to victory</AnimatedH1>
            <AnimatedCopy delay={1.2} animateOnScroll={false}>
              Elevating digital marketing excellence through strategic
              innovation
            </AnimatedCopy>
          </div>
        </section>

        <section className="projects">
          {projectsData.map((project) => (
            <div className="project" key={project.id}>
              <div className="project-banner-img">
                <ParallaxImage src={project.imageUrl} alt={project.name} />
                <div className="project-title">
                  <a
                    href={withBasePath("/project")}
                    onClick={(e) => handleNavigation(e, "/project")}
                  >
                    <AnimatedH1 animateOnScroll={true}>
                      {project.name}
                    </AnimatedH1>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </section>

        <Footer />
      </div>
    </ReactLenis>
  );
};

export default Page;

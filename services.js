import gsap from "gsap";

const setupDraggableMenu = () => {
  const menuOverlay = document.querySelector(".menu-overlay");
  const menuPanel = document.querySelector(".menu-panel");
  const menuLinks = document.querySelectorAll(".menu-link");
  const menuBtn = document.querySelector(".navbar-menu-btn");

  if (!menuBtn) return;

  let isMenuOpen = false;

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
    isMenuOpen = !isMenuOpen;
  };

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  const openMenu = () => {
    menuBtn.classList.add("active");
    if (menuOverlay) menuOverlay.classList.add("active");
    if (menuPanel) menuPanel.classList.add("active");

    gsap.fromTo(menuPanel,
      {
        height: 0,
        opacity: 0,
      },
      {
        height: "auto",
        opacity: 1,
        duration: 0.8,
        ease: "power4.out",
      }
    );

    gsap.fromTo(menuLinks,
      {
        opacity: 0,
        filter: "blur(10px)",
      },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.08,
        delay: 0.3,
        ease: "power3.out"
      }
    );

    const footerSections = document.querySelectorAll(".menu-footer-section");
    gsap.fromTo(footerSections,
      {
        opacity: 0,
        filter: "blur(8px)",
      },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.7,
        stagger: 0.1,
        delay: 0.6,
        ease: "power3.out"
      }
    );
  };

  const closeMenu = () => {
    menuBtn.classList.remove("active");
    if (menuOverlay) menuOverlay.classList.remove("active");

    gsap.to(menuLinks, {
      opacity: 0,
      filter: "blur(8px)",
      duration: 0.4,
      stagger: 0.04,
      ease: "power3.in"
    });

    const footerSections = document.querySelectorAll(".menu-footer-section");
    gsap.to(footerSections, {
      opacity: 0,
      filter: "blur(6px)",
      duration: 0.3,
      ease: "power3.in"
    });

    gsap.to(menuPanel, {
      height: 0,
      opacity: 0,
      duration: 0.5,
      delay: 0.3,
      ease: "power3.in",
      onComplete: () => {
        if (menuPanel) menuPanel.classList.remove("active");
      }
    });
  };

  if (menuOverlay) {
    menuOverlay.addEventListener("click", () => {
      if (isMenuOpen) {
        closeMenu();
        isMenuOpen = false;
      }
    });
  }

  menuLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (isMenuOpen) {
        closeMenu();
        isMenuOpen = false;
      }
    });
  });
};

setupDraggableMenu();

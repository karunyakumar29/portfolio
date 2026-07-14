(function () {
  /* ==========================================
     NAV BAR LOGIC
     ========================================== */
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("siteNavToggle");
  const links = document.getElementById("siteNavLinks");

  if (nav && toggle && links) {
    toggle.addEventListener("click", function () {
      const isOpen = links.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    function onScroll() {
      if (window.scrollY > 20) {
        nav.classList.add("is-scrolled");
      } else {
        nav.classList.remove("is-scrolled");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================
     INTERSECTION OBSERVER FOR ENTRANCE ANIMS
     ========================================== */
  const revealElements = document.querySelectorAll(".scroll-reveal");
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );
    
    revealElements.forEach((el) => revealObserver.observe(el));
  }

  /* ==========================================
     POSTERS SHOWCASE (MANUAL CAROUSEL SLIDER)
     ========================================== */
  const track = document.getElementById("postersTrack");
  const viewport = document.getElementById("postersViewport");
  const prevBtn = document.getElementById("prevPoster");
  const nextBtn = document.getElementById("nextPoster");

  if (track && viewport) {
    let index = 0;
    
    // Retrieve layout metrics
    const getSlideWidth = () => {
      const slide = track.querySelector(".poster-slide");
      return slide ? slide.offsetWidth + 24 : 324; // slide + gap
    };

    const maxIndex = () => {
      const slides = track.querySelectorAll(".poster-slide");
      const visibleSlides = Math.floor(viewport.offsetWidth / getSlideWidth());
      return Math.max(0, slides.length - visibleSlides);
    };

    const slideTo = (newIndex) => {
      index = Math.max(0, Math.min(newIndex, maxIndex()));
      const translateVal = -index * getSlideWidth();
      track.style.transform = `translateX(${translateVal}px)`;
    };

    nextBtn?.addEventListener("click", () => {
      if (index >= maxIndex()) {
        slideTo(0); // Wrap back to start
      } else {
        slideTo(index + 1);
      }
    });

    prevBtn?.addEventListener("click", () => {
      if (index <= 0) {
        slideTo(maxIndex()); // Wrap to end
      } else {
        slideTo(index - 1);
      }
    });

    // Touch & Swipe Event Handlers
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;

    viewport.addEventListener("touchstart", dragStart, { passive: true });
    viewport.addEventListener("touchend", dragEnd);
    viewport.addEventListener("touchmove", dragAction, { passive: true });

    viewport.addEventListener("mousedown", dragStart);
    viewport.addEventListener("mouseup", dragEnd);
    viewport.addEventListener("mouseleave", dragEnd);
    viewport.addEventListener("mousemove", dragAction);

    function dragStart(e) {
      isDragging = true;
      startX = getPositionX(e);
      track.style.transition = "none";
      animationID = requestAnimationFrame(animation);
    }

    function dragAction(e) {
      if (!isDragging) return;
      const currentX = getPositionX(e);
      const diff = currentX - startX;
      currentTranslate = prevTranslate + diff;
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      cancelAnimationFrame(animationID);
      track.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";

      const movedBy = currentTranslate - prevTranslate;
      const threshold = 40; // pixel movement threshold to swap slide

      if (movedBy < -threshold && index < maxIndex()) {
        index += 1;
      } else if (movedBy > threshold && index > 0) {
        index -= 1;
      }

      slideTo(index);
      prevTranslate = -index * getSlideWidth();
    }

    function getPositionX(e) {
      return e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
    }

    function animation() {
      track.style.transform = `translateX(${currentTranslate}px)`;
      if (isDragging) requestAnimationFrame(animation);
    }

    window.addEventListener("resize", () => slideTo(index));
  }

  /* ==========================================
     DOTTED LINE SVG DYNAMIC DRAWING LOGIC
     ========================================== */
  const svg = document.querySelector(".dotted-path-svg");
  const path = document.getElementById("dottedPath");
  const bullets = document.querySelectorAll(".whatido__card-bullet");
  const whatidoSection = document.querySelector(".whatido");

  function drawDottedLine() {
    if (!svg || !path || bullets.length < 2) return;

    const svgRect = svg.getBoundingClientRect();
    const points = Array.from(bullets).map((bullet) => {
      const rect = bullet.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - svgRect.left,
        y: rect.top + rect.height / 2 - svgRect.top
      };
    });

    // Generate smooth vertical S-curves connecting bullet points
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      
      const dy = p1.y - p0.y;
      
      // Vertical S-curve control points
      const cpX1 = p0.x;
      const cpY1 = p0.y + dy * 0.5;
      const cpX2 = p1.x;
      const cpY2 = p1.y - dy * 0.5;

      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    path.setAttribute("d", d);
    
    // Set dash array settings based on path length
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength} ${pathLength}`;
    path.style.strokeDashoffset = pathLength;

    updatePathScroll();
  }

  function updatePathScroll() {
    if (!path || !whatidoSection) return;

    const pathLength = path.getTotalLength();
    const rect = whatidoSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Draw path as user scrolls through the 'What I Do' section
    const startOffset = rect.top - viewportHeight * 0.65;
    const scrollRange = rect.height + viewportHeight * 0.2;
    const progress = Math.max(0, Math.min(1, -startOffset / scrollRange));

    path.style.strokeDashoffset = pathLength * (1 - progress);
  }

  // Bind path draw and scroll observers
  if (svg && path && bullets.length > 0) {
    window.addEventListener("resize", drawDottedLine);
    window.addEventListener("scroll", updatePathScroll, { passive: true });
    
    // Initial draw once layout rendering stabilizes
    setTimeout(drawDottedLine, 100);
    window.addEventListener("load", drawDottedLine);
  }


  /* ==========================================
     CONTACT FORM THANK YOU STATE
     ========================================== */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitBtn = contactForm.querySelector(".contact-form__submit-new");
      const statusBox = document.getElementById("formStatus");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "SENDING...";
      }

     

      contactForm.reset();

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "SEND MESSAGE";
        }
      }, 2500);
    });
  }

  /* ==========================================
     BEFORE/AFTER TOGGLE FOR WEB MOCKUP
     ========================================== */
  document.addEventListener("DOMContentLoaded", () => {
    const targetMockupImage = document.getElementById("web-mockup-asset");
    const toggleButtons = document.querySelectorAll(".toggle-radio");

    if (targetMockupImage && toggleButtons && toggleButtons.length > 0) {
      toggleButtons.forEach(button => {
        button.addEventListener("change", () => {
          if (button.value === "before") {
            targetMockupImage.src = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&h=2400&auto=format&fit=crop";
          } else {
            targetMockupImage.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&h=2400&auto=format&fit=crop";
          }
        });
      });
    }
  });

  /* ==========================================
     RESUME MODAL SHOW/HIDE LOGIC
     ========================================== */
  const resumeLink = document.getElementById("resumeLink");
  const resumeModal = document.getElementById("resumeModal");
  const resumeModalClose = document.getElementById("resumeModalClose");
  const resumeModalOverlay = document.getElementById("resumeModalOverlay");

  if (resumeLink && resumeModal) {
    resumeLink.addEventListener("click", function (e) {
      e.preventDefault();
      resumeModal.classList.add("is-visible");
      resumeModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });

    function closeResumeModal() {
      resumeModal.classList.remove("is-visible");
      resumeModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    resumeModalClose?.addEventListener("click", closeResumeModal);
    resumeModalOverlay?.addEventListener("click", closeResumeModal);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && resumeModal.classList.contains("is-visible")) {
        closeResumeModal();
      }
    });
  }

})();
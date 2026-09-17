document.addEventListener('DOMContentLoaded', () => {
  const alertClose = document.getElementById('alert-close');
  const alertSection = document.querySelector('.alert-section');
  
  const closeAlert = () => {
    alertSection?.classList.remove('open');
    document.body.style.overflow = '';
  };
  
  if (alertClose && alertSection) {
    setTimeout(() => {
      alertSection.classList.add('open');
      document.body.style.overflow = 'hidden';
    }, 1000);
  
    alertClose.addEventListener('click', closeAlert);
  
    alertSection.addEventListener('click', (event) => {
      if (event.target === alertSection) {
        closeAlert();
      }
    });
  }
  
  const targetDate = new Date('2025-10-21T00:00:00').getTime();
  
    const updateCounter = () => {
      const distance = Math.max(Date.now() - targetDate, 0);
  
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
      const daysElement = document.getElementById('c-days');
      const hoursElement = document.getElementById('c-hours');
      const minutesElement = document.getElementById('c-min');
      const secondsElement = document.getElementById('c-sec');
  
      if (daysElement) daysElement.textContent = String(days);
      if (hoursElement) hoursElement.textContent = String(hours).padStart(2, '0');
      if (minutesElement) minutesElement.textContent = String(minutes).padStart(2, '0');
      if (secondsElement) secondsElement.textContent = String(seconds).padStart(2, '0');
    };
  
    updateCounter();
    setInterval(updateCounter, 1000);
    const slides = Array.from(document.querySelectorAll('.home-slide'));
    let currentSlide = 0;
    
    if (slides.length > 1) {
      setInterval(() => {
        slides[currentSlide].classList.remove('active');
    
        currentSlide = (currentSlide + 1) % slides.length;
    
        slides[currentSlide].classList.add('active');
      }, 5000);
    }
    const orientationSlides = Array.from(
      document.querySelectorAll('.orientations-slide')
    );
    
    let currentOrientationSlide = 0;
    
    if (orientationSlides.length > 1) {
      setInterval(() => {
        orientationSlides[currentOrientationSlide].classList.remove('active');
    
        currentOrientationSlide =
          (currentOrientationSlide + 1) % orientationSlides.length;
    
        orientationSlides[currentOrientationSlide].classList.add('active');
      }, 5000);
    }

    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('main-nav');
  
    if (hamburger && mainNav) {
      hamburger.addEventListener('click', () => {
        mainNav.classList.toggle('open');
        const expanded = mainNav.classList.contains('open');
        hamburger.setAttribute('aria-expanded', String(expanded));
      });
    }
  
    if (window.innerWidth <= 768) {
      document.querySelectorAll('.has-dropdown > a').forEach((link) => {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          link.parentElement?.classList.toggle('open');
        });
      });
    }

    const ingresantesSearch = document.getElementById('ingresantes-search');
    const ingresantesTable = document.getElementById('ingresantes-table');
    const ingresantesCount = document.getElementById('ingresantes-count');

    if (ingresantesSearch && ingresantesTable) {
      const rows = Array.from(ingresantesTable.querySelectorAll('tbody tr:not(.admission-results-empty)'));
      const updateIngresantes = () => {
        const query = ingresantesSearch.value.trim().toLocaleLowerCase('es');
        let visible = 0;
        rows.forEach((row) => {
          const matches = row.textContent.toLocaleLowerCase('es').includes(query);
          row.hidden = !matches;
          if (matches) visible += 1;
        });
        if (ingresantesCount) ingresantesCount.textContent = `${visible} resultado${visible === 1 ? '' : 's'}`;
      };
      ingresantesSearch.addEventListener('input', updateIngresantes);
      updateIngresantes();
    }

    const activitiesTrack = document.getElementById('home-activities-track');
    const activitiesPrev = document.querySelector('.home-activities-prev');
    const activitiesNext = document.querySelector('.home-activities-next');

    if (activitiesTrack && activitiesPrev && activitiesNext) {
      const getStep = () => {
        const card = activitiesTrack.querySelector('.home-activity-card');
        return card ? card.getBoundingClientRect().width + 22 : activitiesTrack.clientWidth;
      };
      const moveActivities = (direction) => {
        const maxScroll = activitiesTrack.scrollWidth - activitiesTrack.clientWidth;
        if (direction > 0 && activitiesTrack.scrollLeft >= maxScroll - 8) {
          activitiesTrack.scrollTo({ left: 0, behavior: 'smooth' });
        } else if (direction < 0 && activitiesTrack.scrollLeft <= 8) {
          activitiesTrack.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          activitiesTrack.scrollBy({ left: direction * getStep(), behavior: 'smooth' });
        }
      };
      activitiesPrev.addEventListener('click', () => moveActivities(-1));
      activitiesNext.addEventListener('click', () => moveActivities(1));

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let activitiesTimer = setInterval(() => moveActivities(1), 5000);
        const pause = () => clearInterval(activitiesTimer);
        const resume = () => {
          clearInterval(activitiesTimer);
          activitiesTimer = setInterval(() => moveActivities(1), 5000);
        };
        activitiesTrack.addEventListener('mouseenter', pause);
        activitiesTrack.addEventListener('mouseleave', resume);
        activitiesTrack.addEventListener('focusin', pause);
        activitiesTrack.addEventListener('focusout', resume);
      }
    }

    const technicalWeekCarousel = document.querySelector('[data-technical-week-carousel]');
    if (technicalWeekCarousel) {
      const slides = Array.from(technicalWeekCarousel.querySelectorAll('.technical-week-slide'));
      const dots = Array.from(technicalWeekCarousel.querySelectorAll('[data-slide-to]'));
      const previous = technicalWeekCarousel.querySelector('.technical-week-prev');
      const next = technicalWeekCarousel.querySelector('.technical-week-next');
      let current = 0;
      let timer;

      const showSlide = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === current));
        dots.forEach((dot, dotIndex) => {
          dot.classList.toggle('is-active', dotIndex === current);
          dot.setAttribute('aria-selected', String(dotIndex === current));
        });
      };
      const restart = () => {
        window.clearInterval(timer);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          timer = window.setInterval(() => showSlide(current + 1), 6000);
        }
      };
      previous?.addEventListener('click', () => { showSlide(current - 1); restart(); });
      next?.addEventListener('click', () => { showSlide(current + 1); restart(); });
      dots.forEach((dot, index) => dot.addEventListener('click', () => { showSlide(index); restart(); }));
      technicalWeekCarousel.addEventListener('mouseenter', () => window.clearInterval(timer));
      technicalWeekCarousel.addEventListener('mouseleave', restart);
      showSlide(0);
      restart();
    }

    const studyTripsCarousel = document.querySelector('[data-study-trips-carousel]');
    if (studyTripsCarousel) {
      const slides = Array.from(studyTripsCarousel.querySelectorAll('.study-trip-slide'));
      const dots = Array.from(studyTripsCarousel.querySelectorAll('[data-study-trip-to]'));
      const previous = studyTripsCarousel.querySelector('.study-trips-prev');
      const next = studyTripsCarousel.querySelector('.study-trips-next');
      let current = 0;
      let timer;
      const showSlide = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === current));
        dots.forEach((dot, dotIndex) => {
          dot.classList.toggle('is-active', dotIndex === current);
          dot.setAttribute('aria-selected', String(dotIndex === current));
        });
      };
      const restart = () => {
        window.clearInterval(timer);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = window.setInterval(() => showSlide(current + 1), 6000);
      };
      previous?.addEventListener('click', () => { showSlide(current - 1); restart(); });
      next?.addEventListener('click', () => { showSlide(current + 1); restart(); });
      dots.forEach((dot, index) => dot.addEventListener('click', () => { showSlide(index); restart(); }));
      studyTripsCarousel.addEventListener('mouseenter', () => window.clearInterval(timer));
      studyTripsCarousel.addEventListener('mouseleave', restart);
      showSlide(0);
      restart();
    }
  });

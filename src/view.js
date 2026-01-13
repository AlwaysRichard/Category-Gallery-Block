/**
 * AP Category Gallery Block - Frontend JavaScript
 * Handles lightbox, click menus, tiled layout, and collage layout
 */

(function() {
  'use strict';
  console.log('AP Category Gallery v2 - Loading...');
  
  function init() {
    console.log('AP Category Gallery v2 - Initializing...');
    
    // ----- Lightbox for image viewing -----
    var lightboxHTML = '<div class="cat-lightbox" id="cat-lightbox">' +
      '<button class="cat-lightbox__close" aria-label="Close">&times;</button>' +
      '<img class="cat-lightbox__img" src="" alt="" />' +
      '<div class="cat-lightbox__caption"></div>' +
      '<div class="cat-lightbox__nav">' +
        '<button class="cat-lightbox__prev" aria-label="Previous">&larr;</button>' +
        '<button class="cat-lightbox__next" aria-label="Next">&rarr;</button>' +
      '</div>' +
    '</div>';
    
    if (!document.getElementById('cat-lightbox')) {
      document.body.insertAdjacentHTML('beforeend', lightboxHTML);
      console.log('AP Category Gallery: Lightbox HTML inserted');
    }
    
    var lightbox = document.getElementById('cat-lightbox');
    var lightboxImg = lightbox.querySelector('.cat-lightbox__img');
    var lightboxCaption = lightbox.querySelector('.cat-lightbox__caption');
    var closeBtn = lightbox.querySelector('.cat-lightbox__close');
    var prevBtn = lightbox.querySelector('.cat-lightbox__prev');
    var nextBtn = lightbox.querySelector('.cat-lightbox__next');
    
    var allImages = [];
    var currentImageIndex = -1;
    
    function openLightbox(imageSrc, caption, index) {
      console.log('Opening lightbox for image:', imageSrc);
      lightboxImg.src = imageSrc;
      lightboxImg.alt = caption || '';
      lightboxCaption.textContent = caption || '';
      currentImageIndex = index;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      updateNavButtons();
    }
    
    function closeLightbox() {
      console.log('Closing lightbox');
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      lightboxImg.src = '';
      lightboxCaption.textContent = '';
      currentImageIndex = -1;
    }
    
    function updateNavButtons() {
      prevBtn.disabled = currentImageIndex <= 0;
      nextBtn.disabled = currentImageIndex >= allImages.length - 1;
    }
    
    function showPrevImage() {
      if (currentImageIndex > 0) {
        var prevImage = allImages[currentImageIndex - 1];
        openLightbox(prevImage.fullSrc, prevImage.caption, currentImageIndex - 1);
      }
    }
    
    function showNextImage() {
      if (currentImageIndex < allImages.length - 1) {
        var nextImage = allImages[currentImageIndex + 1];
        openLightbox(nextImage.fullSrc, nextImage.caption, currentImageIndex + 1);
      }
    }
    
    // Close button
    closeBtn.addEventListener('click', closeLightbox);
    
    // Navigation buttons
    prevBtn.addEventListener('click', showPrevImage);
    nextBtn.addEventListener('click', showNextImage);
    
    // Close on outside click
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('is-open')) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      }
    });
    
    // ----- Click menu handling -----
    document.addEventListener('click', function(e) {
      var menuTrigger = e.target.closest('.cat-gallery__menu-trigger');
      
      if (menuTrigger) {
        console.log('Menu trigger clicked');
        var menu = menuTrigger.querySelector('.cat-gallery__menu');
        if (menu) {
          var isOpen = menu.classList.contains('is-open');
          
          // Close all menus first
          document.querySelectorAll('.cat-gallery__menu').forEach(function(m) {
            m.classList.remove('is-open');
          });
          
          // Toggle this menu
          if (!isOpen) {
            menu.classList.add('is-open');
          }
          
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      
      // Close menus when clicking outside
      if (!e.target.closest('.cat-gallery__menu')) {
        document.querySelectorAll('.cat-gallery__menu').forEach(function(m) {
          m.classList.remove('is-open');
        });
      }
      
      // Handle lightbox trigger clicks
      var lightboxTrigger = e.target.closest('.cat-gallery__lightbox-trigger');
      if (lightboxTrigger) {
        e.preventDefault();
        var fullImage = lightboxTrigger.getAttribute('data-full-image');
        var caption = lightboxTrigger.closest('.cat-gallery__item').querySelector('img')?.alt || '';
        
        // Find the index of this image in the gallery
        var gallery = lightboxTrigger.closest('.cat-gallery');
        var imageElements = gallery.querySelectorAll('[data-full-image]');
        var index = Array.from(imageElements).indexOf(lightboxTrigger);
        
        openLightbox(fullImage, caption, index);
      }
    });
    
    // Build all images array for navigation
    document.querySelectorAll('.cat-gallery').forEach(function(gallery) {
      var imageElements = gallery.querySelectorAll('[data-full-image]');
      allImages = Array.from(imageElements).map(function(el) {
        return {
          fullSrc: el.getAttribute('data-full-image'),
          caption: el.closest('.cat-gallery__item').querySelector('img')?.alt || ''
        };
      });
    });
    
    // ----- TILED layout (justified rows) -----
    function layoutTiled() {
      console.log('Running tiled layout...');
      var galleries = document.querySelectorAll('.cat-gallery--tiled');
      
      galleries.forEach(function(gallery) {
        var targetHeight = parseInt(gallery.getAttribute('data-target-height') || 250);
        var gutter = parseInt(gallery.getAttribute('data-gutter') || 8);
        var items = Array.from(gallery.querySelectorAll('.cat-gallery__item'));
        
        if (!items.length) return;
        
        // Get container width
        var containerWidth = gallery.clientWidth;
        
        // Process images into rows
        var currentRow = [];
        var currentRowWidth = 0;
        
        items.forEach(function(item, idx) {
          var img = item.querySelector('img');
          if (!img) return;
          
          var aspectRatio = img.naturalWidth / img.naturalHeight;
          var itemWidth = targetHeight * aspectRatio;
          
          currentRow.push({ item: item, width: itemWidth, aspectRatio: aspectRatio });
          currentRowWidth += itemWidth;
          
          // Check if we should complete this row
          var isLastItem = (idx === items.length - 1);
          var rowWithGutters = currentRowWidth + (gutter * (currentRow.length - 1));
          
          if (rowWithGutters >= containerWidth || isLastItem) {
            // Calculate actual height to fit the row
            var availableWidth = containerWidth - (gutter * (currentRow.length - 1));
            var scaleFactor = availableWidth / currentRowWidth;
            var rowHeight = targetHeight * scaleFactor;
            
            // Apply dimensions
            currentRow.forEach(function(rowItem) {
              var itemWidth = rowItem.width * scaleFactor;
              rowItem.item.style.width = itemWidth + 'px';
              rowItem.item.style.height = rowHeight + 'px';
            });
            
            // Reset for next row
            currentRow = [];
            currentRowWidth = 0;
          }
        });
      });
    }
    
    // ----- COLLAGE layout (Metro grid) -----
    function layoutCollage() {
      console.log('Running collage layout...');
      var galleries = document.querySelectorAll('.cat-gallery--collage');
      
      galleries.forEach(function(gallery) {
        var items = Array.from(gallery.querySelectorAll('.cat-gallery__item'));
        
        items.forEach(function(item) {
          var img = item.querySelector('img');
          if (!img) return;
          
          var aspectRatio = img.naturalWidth / img.naturalHeight;
          
          // Assign grid spans based on aspect ratio
          var colSpan = 2;
          var rowSpan = 2;
          
          if (aspectRatio > 1.5) {
            colSpan = 3;
            rowSpan = 2;
          } else if (aspectRatio < 0.7) {
            colSpan = 2;
            rowSpan = 3;
          } else if (aspectRatio > 0.9 && aspectRatio < 1.1) {
            colSpan = 2;
            rowSpan = 2;
          }
          
          item.style.gridColumn = 'span ' + colSpan;
          item.style.gridRow = 'span ' + rowSpan;
        });
      });
    }
    
    // Run layouts
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        layoutTiled();
        layoutCollage();
      });
    } else {
      layoutTiled();
      layoutCollage();
    }
    
    // Re-layout on window resize (debounced)
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        layoutTiled();
        layoutCollage();
      }, 250);
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

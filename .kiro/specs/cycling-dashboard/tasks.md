# Implementation Plan

- [x] 1. Create the base HTML structure with all four views





  - Create `index.html` file with DOCTYPE and basic HTML5 structure
  - Add meta tags for charset and viewport configuration
  - Include script tags for jQuery and Funifier SDK from CDN
  - Create four main view container divs with unique IDs (view-1, view-2, view-3, view-4)
  - Add CSS class "view" to all view containers for shared styling
  - Add "active" class to view-1 as the initial visible view
  - _Requirements: 1.1, 1.2, 7.2_

- [x] 2. Implement View 1 with BI iframe

  - Add iframe element inside view-1 container
  - Set iframe src to "https://lookerstudio.google.com/embed/reporting/601fc253-c576-410f-b3fb-437d9f892ae3/page/8QlXF"
  - Configure iframe attributes (width, height, frameborder, allowfullscreen)
  - _Requirements: 2.1, 2.2, 2.3_
-

- [x] 3. Build widget layout structure for Views 2, 3, and 4





  - [x] 3.1 Create View 2 HTML structure

    - Add widget-container div inside view-2
    - Create widget-large div with id "widget-1-large" for Widget 1
    - Create widget-row div containing two widget-small divs
    - Add ids "widget-2-small-v2" and "widget-3-small-v2" to small widget containers
    - _Requirements: 3.1, 3.2, 3.3_
  

  - [x] 3.2 Create View 3 HTML structure

    - Add widget-container div inside view-3
    - Create widget-large div with id "widget-2-large" for Widget 2
    - Create widget-row div containing two widget-small divs
    - Add ids "widget-1-small-v3" and "widget-3-small-v3" to small widget containers
    - _Requirements: 4.1, 4.2, 4.3_
  

  - [x] 3.3 Create View 4 HTML structure

    - Add widget-container div inside view-4
    - Create widget-large div with id "widget-3-large" for Widget 3
    - Create widget-row div containing two widget-small divs
    - Add ids "widget-1-small-v4" and "widget-2-small-v4" to small widget containers
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Implement CSS styling for view management and layouts






  - [x] 4.1 Add global styles and view visibility controls

    - Reset body margin and padding to zero
    - Set body and html height to 100%
    - Style .view class with position absolute, full viewport dimensions (100vw, 100vh)
    - Set default display: none for .view class
    - Set display: block for .view.active class
    - Add overflow: hidden to prevent scrollbars
    - _Requirements: 1.1, 2.3_
  

  - [x] 4.2 Style BI iframe for View 1

    - Set iframe width and height to 100%
    - Remove iframe border
    - _Requirements: 2.3_
  
  - [x] 4.3 Create flexbox layouts for widget views

    - Style .widget-container with display: flex, flex-direction: column, height: 100%
    - Style .widget-large with height: 50%, width: 100%
    - Style .widget-row with display: flex, flex-direction: row, height: 50%
    - Style .widget-small with flex: 1 (equal width distribution)
    - Add box-sizing: border-box to all widget containers
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 5. Implement view cycling JavaScript logic





  - Declare currentView variable initialized to 0
  - Declare totalViews constant set to 4
  - Create cycleViews() function that removes 'active' class from current view
  - Increment currentView using modulo operator to loop back to 0 after view 3
  - Add 'active' class to the new current view
  - Use setInterval to call cycleViews every 10000 milliseconds (10 seconds)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.3_

- [x] 6. Implement Funifier widget initialization




  - [x] 6.1 Create Funifier initialization function


    - Wrap initialization in jQuery document ready or window load event
    - Call Funifier.init() with apiKey "69027af6e179d46fce283e7e" and service URL "https://service2.funifier.com"
    - Set authorization using Funifier.auth.setAuthorization() with token "Basic NjkwMjdhZjZlMTc5ZDQ2ZmNlMjgzZTdlOjY5MDI4MjI0ZTE3OWQ0NmZjZTI4NDI2ZA=="
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 6.2 Render all widget instances

    - Call Funifier.widget.render() for widget "espacial" in selectors "#widget-1-large", "#widget-1-small-v3", "#widget-1-small-v4"
    - Call Funifier.widget.render() for widget "corrida_espacial__referidos" in selectors "#widget-2-small-v2", "#widget-2-large", "#widget-2-small-v4"
    - Call Funifier.widget.render() for widget "corrida_espacial__sdr" in selectors "#widget-3-small-v2", "#widget-3-small-v3", "#widget-3-large"
    - Set bind parameter to "replace" for all widget renders
    - Add error callback logging to console for debugging
    - _Requirements: 3.4, 4.4, 5.4, 6.4_

- [x] 7. Configure and Test the complete application





  - Configure the app to be prepared to be uploaded to github (Configure git)
  -Configure teh app to be prepared to be hosted on vercel (Configure vercel)
  - Open index.html in a web browser
  - Verify View 1 displays with BI iframe loading correctly
  - Confirm automatic transition to View 2 after 10 seconds
  - Verify View 2 shows Widget 1 large at top, Widgets 2 and 3 small at bottom
  - Confirm automatic transition to View 3 after 10 seconds
  - Verify View 3 shows Widget 2 large at top, Widgets 1 and 3 small at bottom
  - Confirm automatic transition to View 4 after 10 seconds
  - Verify View 4 shows Widget 3 large at top, Widgets 1 and 2 small at bottom
  - Confirm automatic transition back to View 1 after 10 seconds
  - Verify all Funifier widgets render with data
  - Let application run for multiple cycles to confirm continuous operation
  - _Requirements: All requirements_

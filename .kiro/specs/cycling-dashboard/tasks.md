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

- [x] 7. Implement authentication screen HTML structure



  - Add auth-screen div with class "auth-screen" before dashboard-container
  - Create auth-container div inside auth-screen for centered content
  - Add h1 element with class "auth-title" and text "Acceso al Dashboard"
  - Create auth-progress div with id "auth-progress" containing progress text span
  - Add auth-buttons div with id "auth-buttons" for button container
  - Add auth-feedback div with id "auth-feedback" for error messages
  - Wrap existing dashboard views in dashboard-container div with id "dashboard-container"
  - Set dashboard-container to display: none by default
  - _Requirements: 8.1, 8.2_

- [x] 8. Implement authentication screen CSS styling



  - Style auth-screen as full viewport overlay with flexbox centering
  - Set auth-screen background color with high contrast for TV visibility
  - Style auth-container with max-width and padding
  - Style auth-title with large font size (minimum 48px) for TV readability
  - Create grid layout for auth-buttons (2 rows × 3 columns with gap)
  - Style auth-button with minimum 150px height, large font (32px), and padding
  - Add prominent focus state with 4px solid border and high contrast color
  - Style auth-button hover and active states for visual feedback
  - Style auth-feedback for error messages (red color, large font)
  - Style auth-progress to show selection count prominently
  - _Requirements: 8.2, 10.1, 10.2_

- [x] 9. Implement authentication configuration and state management



  - Create AUTH_CONFIG object with words array containing 6 pediatric medical terms: "PEDIATRÍA", "VACUNA", "DIAGNÓSTICO", "TRATAMIENTO", "PACIENTE", "CONSULTA"
  - Set correctSequence array in AUTH_CONFIG (configurable 4-word sequence)
  - Set sequenceLength to 4 in AUTH_CONFIG
  - Declare userSequence array to track user selections
  - _Requirements: 8.2, 8.5_

- [x] 10. Implement authentication button rendering and randomization


  - [x] 10.1 Create renderAuthButtons function



    - Shuffle AUTH_CONFIG.words array using sort with random comparator
    - Clear auth-buttons container innerHTML
    - Loop through shuffled words and create button elements
    - Set button className to "auth-button", textContent to word, tabindex to 0
    - Attach onclick handler calling handleWordSelection(word)
    - Append buttons to auth-buttons container
    - Focus first button for TV remote navigation
    - _Requirements: 8.2, 8.3_
  
  - [x] 10.2 Write property test for button randomization



    - **Property 1: Button randomization produces different orderings**
    - **Validates: Requirements 8.3**
    - Test that multiple calls to renderAuthButtons produce different button orders
    - Run minimum 100 iterations to account for randomness
    - _Requirements: 8.3_

- [x] 11. Implement word selection handling


  - [x] 11.1 Create handleWordSelection function



    - Push selected word to userSequence array
    - Call updateProgress to refresh progress display
    - Check if userSequence.length equals AUTH_CONFIG.sequenceLength
    - If sequence complete, call validateSequence function
    - _Requirements: 8.4, 8.5_
  
  - [x] 11.2 Write property test for selection state updates



    - **Property 2: Button selection updates state and provides feedback**
    - **Validates: Requirements 8.4**
    - Test that clicking any button increases userSequence length by 1
    - Verify progress display updates after each selection
    - Run minimum 100 iterations with different button selections
    - _Requirements: 8.4_

- [x] 12. Implement sequence validation logic


  - [x] 12.1 Create validateSequence function



    - Compare userSequence with AUTH_CONFIG.correctSequence using array equality check
    - If correct, set sessionStorage item 'dashboard_authenticated' to 'true'
    - If correct, call showDashboard function
    - If incorrect, call showError function
    - If incorrect, use setTimeout to call resetAuth after 2000ms
    - _Requirements: 8.5, 9.1, 9.2, 9.3_
  
  - [x] 12.2 Write property test for validation behavior



    - **Property 3: Sequence validation behavior is correct**
    - **Validates: Requirements 8.5, 9.1, 9.2, 9.3**
    - Test that correct sequences trigger dashboard display
    - Test that incorrect sequences show error and reset
    - Test with various correct and incorrect sequence combinations
    - Run minimum 100 iterations
    - _Requirements: 8.5, 9.1, 9.2, 9.3_

- [x] 13. Implement authentication UI helper functions



  - Create updateProgress function to display selection count (e.g., "2 / 4 seleccionadas")
  - Create showError function to display error message in auth-feedback element
  - Create clearError function to clear auth-feedback content
  - Create resetAuth function to clear userSequence, update progress, re-render buttons, and clear error
  - _Requirements: 9.2, 9.3, 10.4_

- [x] 14. Implement dashboard display and initialization


  - [x] 14.1 Create showDashboard function



    - Hide auth-screen by setting display to 'none'
    - Show dashboard-container by setting display to 'block'
    - Call initializeFunifier to load widgets
    - Start view cycling by calling existing cycleViews setup
    - _Requirements: 9.1_
  
  - [x] 14.2 Create initAuth function



    - Check sessionStorage for 'dashboard_authenticated' flag
    - If authenticated, call showDashboard immediately
    - If not authenticated, call renderAuthButtons to show auth screen
    - _Requirements: 8.1, 9.4_
  
  - [x] 14.3 Write property test for session persistence



    - **Property 4: Authentication state persists in session**
    - **Validates: Requirements 9.4**
    - Test that successful authentication sets sessionStorage flag
    - Test that flag persists across function calls
    - Run minimum 100 iterations
    - _Requirements: 9.4_

- [x] 15. Implement keyboard navigation for TV remote support



  - Add event listener for keydown events on auth-buttons container
  - Handle ArrowRight, ArrowLeft, ArrowUp, ArrowDown keys to move focus between buttons
  - Handle Enter key to trigger click on focused button
  - Prevent default behavior for arrow keys to avoid page scrolling
  - Calculate next focus target based on grid layout (2 rows × 3 columns)
  - _Requirements: 10.5_

- [x] 16. Integrate authentication with application initialization



  - Modify existing initialization code to call initAuth on page load
  - Ensure Funifier initialization only happens after authentication
  - Ensure view cycling only starts after authentication
  - Update existing window.onload or document.ready to include initAuth call
  - _Requirements: 8.1, 9.1_

- [x] 17. Write additional property tests for UI behavior


  - [x] 17.1 Write property test for focus highlighting



    - **Property 5: Focus state provides visual highlighting**
    - **Validates: Requirements 10.2**
    - Test that focused buttons have distinct visual styling
    - Verify computed styles show focus indicators
    - Run minimum 100 iterations
    - _Requirements: 10.2_
  
  - [x] 17.2 Write property test for progress display



    - **Property 6: Selection count reflects actual selections**
    - **Validates: Requirements 10.4**
    - Test that progress text matches userSequence length for any number of selections (0-4)
    - Run minimum 100 iterations with different selection counts
    - _Requirements: 10.4_

- [x] 18. Write unit tests for authentication edge cases



  - Test initial state with no sessionStorage (auth screen should show)
  - Test initial state with sessionStorage set (dashboard should show)
  - Test exactly 6 buttons are rendered
  - Test button minimum dimensions meet TV requirements
  - Test keyboard navigation with arrow keys
  - Test Enter key selection
  - Test partial sequence handling (less than 4 selections)
  - _Requirements: 8.1, 8.2, 10.1, 10.5_

- [x] 19. Checkpoint - Ensure all authentication tests pass




  - Run all unit tests and property-based tests
  - Verify all tests pass
  - Ask the user if questions arise

- [x] 20. Configure and Test the complete application





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

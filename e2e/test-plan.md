
  <TEST_SCENARIO_1>
    ## Objective: Authenticate User
    ## Test Group: Authentication
    ## Dependencies / Preconditions:
      - User account "10xadmin" with password "<HIDDEN>" must exist.
      - Must be logged out.
    ## Setup Steps (if needed beyond starting page):
      - None required beyond navigating to the initial page.
    ## Test Suite: authentication.spec.ts
    ## User Workflow Steps:
      1. Navigate to the login page: `localhost:3000/login`.
      2. Enter valid username "10xadmin" into the username field.
      3. Enter valid password "<HIDDEN>" into the password field.
      4. Click the "Login" button.
    ## Expected Outcomes / Assertions:
      - User is redirected to the main dashboard page: `localhost:3000/home`.
      - The "Welcome to 10xCMS" heading is displayed.
      - The "Logout" link is visible.
    ## Dynamic Data Considerations:
      - None
    ## Potential Challenges:
      - None
  </TEST_SCENARIO_1>

  <TEST_SCENARIO_2>
    ## Objective: Create a new collection
    ## Test Group: Collection Management
    ## Dependencies / Preconditions:
      - User must be logged in.
    ## Setup Steps (if needed beyond starting page):
      - None required beyond navigating to the dashboard page after logging in.
    ## Test Suite: collection.spec.ts
    ## User Workflow Steps:
      1. Navigate to the collections page: `localhost:3000/collections`.
      2. Click the "Create New Collection" button.
      3. Enter "Notes" into the Collection Name field.
      4. Enter "Title" into the first Field Name field.
      5. Click the "Add Field" button.
      6. Enter "Description" into the second Field Name field.
      7. Change the type of "Description" field to "Text (Long)".
      8. Click the "Add Field" button.
      9. Enter "Date" into the third Field Name field.
      10. Change the type of "Date" field to "Date".
      11. Click the "Create Collection" button.
    ## Expected Outcomes / Assertions:
      - A success notification "Collection created successfully!" is displayed.
      - The "Notes" collection is listed in the collections list.
      - The "Notes" collection displays the text "Items: 0".
    ## Dynamic Data Considerations:
      - None.
    ## Potential Challenges:
      - None.
  </TEST_SCENARIO_2>

  <TEST_SCENARIO_3>
    ## Objective: Add a new item to a collection
    ## Test Group: Item Management
    ## Dependencies / Preconditions:
      - User must be logged in.
      - The "Notes" collection must exist.
    ## Setup Steps (if needed beyond starting page):
      - Create the "Notes" collection.
    ## Test Suite: item.spec.ts
    ## User Workflow Steps:
      1. Navigate to the collections page: `localhost:3000/collections`.
      2. Click the "View Collection" button for the "Notes" collection. URL: `localhost:3000/collections/{dynamic-collection-id}`
      3. Click the "Add New Item" button.
      4. Enter "Movies" into the Title field.
      5. Enter "Terminator 2 - Terminator 3" into the Description field.
      6. Enter "01.01.2024" into the Date field.
      7. Click the "Save Item" button.
    ## Expected Outcomes / Assertions:
      - A success notification "Item added successfully!" is displayed.
      - The new item is listed in the items list, with title "Movies", description "Terminator 2 - Terminator 3" and date "2024-01-01".
    ## Dynamic Data Considerations:
      - The collection ID in the URL is dynamic and must be handled. Store the dynamic collection ID after the collection creation in order to use it in the later item creation test
    ## Potential Challenges:
      - None.
  </TEST_SCENARIO_3>

  <TEST_SCENARIO_4>
    ## Objective: Edit an item in a collection
    ## Test Group: Item Management
    ## Dependencies / Preconditions:
      - User must be logged in.
      - The "Notes" collection must exist.
      - An item must exist in the "Notes" collection.
    ## Setup Steps (if needed beyond starting page):
      - Create the "Notes" collection.
      - Add an item to the "Notes" collection.
    ## Test Suite: item.spec.ts
    ## User Workflow Steps:
      1. Navigate to the item list page for the "Notes" collection.
      2. Click the "Edit" button next to the "Movies" item.
      3. Modify the description field to "Updated Description".
      4. Click "Update Item" button.
    ## Expected Outcomes / Assertions:
      - A success notification "Item updated successfully!" is displayed.
      - The item list reflects the updated description for the "Movies" item.
    ## Dynamic Data Considerations:
      - The collection ID in the URL is dynamic and must be handled.
    ## Potential Challenges:
      - None.
  </TEST_SCENARIO_4>

  <TEST_SCENARIO_5>
    ## Objective: Delete an item in a collection
    ## Test Group: Item Management
    ## Dependencies / Preconditions:
      - User must be logged in.
      - The "Notes" collection must exist.
      - An item must exist in the "Notes" collection.
    ## Setup Steps (if needed beyond starting page):
      - Create the "Notes" collection.
      - Add an item to the "Notes" collection.
    ## Test Suite: item.spec.ts
    ## User Workflow Steps:
      1. Navigate to the item list page for the "Notes" collection.
      2. Click the "Delete" button next to the "Movies" item.
      3. Click the "OK" button in the confirmation popup.
    ## Expected Outcomes / Assertions:
      - A success notification "Item deleted successfully!" is displayed.
      - The item list does not show the "Movies" item anymore.
    ## Dynamic Data Considerations:
      - The collection ID in the URL is dynamic and must be handled.
    ## Potential Challenges:
      - Handle the confirmation dialog.
  </TEST_SCENARIO_5>

  <TEST_PLAN_OVERVIEW>
    ## Suggested Page Objects:
      - LoginPage
      - DashboardPage
      - CollectionsPage
      - CollectionDetailsPage
      - CreateCollectionModal
      - AddItemModal
      - EditItemModal

    ## Suggested Test Suites:
      - authentication.spec.ts
      - collection.spec.ts
      - item.spec.ts

    ## General Notes / Strategy:
      - Use login fixture/setup for tests that require authentication.
      - Use unique names for created test data, e.g., "note-${Date.now()}".
      - Consider using API calls for setup to create collections and items faster.
      - After creating a collection, persist the generated id for re-use in the tests.
  </TEST_PLAN_OVERVIEW>

  <SELECTOR_REQUIREMENTS>
    ## Essential Elements for Stable Selectors:
    To facilitate reliable test automation, please ensure stable and unique identifiers (e.g., data-testid attributes) are added for the following key UI elements observed during the workflows:
    - Login button
    - Username input field
    - Password input field
    - Collections link in the header
    - Create New Collection button
    - Collection Name field in the Create Collection modal
    - Field Name fields in the Create Collection modal
    - Field Type dropdowns in the Create Collection modal
    - Create Collection button in the Create Collection modal
    - View Collection button for each collection in the Collections list
    - Add New Item button in the Collection Details page
    - Title field in the Add Item modal
    - Description field in the Add Item modal
    - Date field in the Add Item modal
    - Save Item button in the Add Item modal
    - Edit button for each item in the Collection Details page
    - Delete button for each item in the Collection Details page
    - OK button in the confirmation dialog for deleting an item
  </SELECTOR_REQUIREMENTS>

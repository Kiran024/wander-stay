# TODO for Resolving Issues

## Task 1: Fix TypeError in app.js
- [x] Install multer package via npm
- [x] Add multer import and setup in app.js
- [x] Modify POST /listings route to use multer middleware for parsing multipart data
- [x] Handle image file upload (save locally)

## Task 2: Fix Validation in new.ejs
- [x] Fix script src in views/layouts/boilerplate.ejs from /js/scripts.js to /js/script.js

## Followup Steps
- [ ] Test form submission to ensure no TypeError
- [ ] Test validation by submitting empty form to check red error messages

## Additional Task: Fix Validation in edit.ejs
- [x] Add multer middleware to PUT /listings/:id route for multipart handling
- [x] Remove invalid value attribute from file input in edit.ejs

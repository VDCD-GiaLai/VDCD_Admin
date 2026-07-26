# VDCD – Use Case Document

- **System:** VDCD Website + Admin Panel
- **Version:** 1.0

---

## Actors

- **Guest:** Website visitor (not logged in)
- **Superadmin:** Senior administrator (full access)
- **Editor:** Content editor (content management)
- **Viewer:** Viewer (read-only, view leads)

---

## Module 1 – Authentication (Auth)

### UC-AUTH-01: Login to admin system

- **Actor:** Superadmin, Editor, Viewer
- **Description:** Admin enters email + password to access the admin panel
- **Precondition:** Account has been created and is active

**Main Flow**

1. Admin navigates to `/admin/login`
2. Enters email and password
3. System authenticates credentials
4. System returns access token + refresh token
5. Admin is redirected to the dashboard

**Alternative Flow**

- 3a. Invalid email or password → display error, deny login
- 3b. Account is locked (`is_active = false`) → display account disabled message

**Postcondition**

- Admin is successfully logged in, has JWT to call APIs

### UC-AUTH-02: Refresh login session

- **Actor:** Superadmin, Editor, Viewer
- **Description:** Automatically reissue access token when expired without requiring re-login
- **Precondition:** Refresh token is still valid

**Main Flow**

1. Access token expires
2. Frontend automatically sends refresh token
3. Server issues new access token

**Alternative Flow**

- 2a. Refresh token expired → redirect to login page

### UC-AUTH-03: Logout

- **Actor:** Superadmin, Editor, Viewer
- **Description:** Admin ends the work session

**Main Flow**

1. Admin clicks the logout button
2. System revokes refresh token on server
3. Clears tokens on client
4. Redirects to login page

### UC-AUTH-04: View current account information

- **Actor:** Superadmin, Editor, Viewer
- **Description:** Admin views personal information (name, email, role)

**Main Flow**

1. Admin goes to the profile page
2. System returns information from JWT

---

## Module 2 – Admin Account Management

### UC-ADM-01: View admin account list

- **Actor:** Superadmin
- **Description:** View all admin accounts in the system

**Main Flow**

1. Superadmin goes to Account Management
2. System displays list: name, email, role, status
3. Can filter by role

### UC-ADM-02: Create new admin account

- **Actor:** Superadmin
- **Description:** Add an account for a new member of the admin team
- **Precondition:** Email does not already exist in the system

**Main Flow**

1. Superadmin clicks "Add Account"
2. Enters: username, email, password, role
3. System creates account and sends notification email (if applicable)

**Alternative Flow**

- 3a. Email already exists → show duplicate email error

### UC-ADM-03: Update admin account

- **Actor:** Superadmin
- **Description:** Edit information, change role, or reset password

**Main Flow**

1. Superadmin selects the account to edit
2. Modifies the necessary fields
3. Saves changes

### UC-ADM-04: Lock / Unlock account

- **Actor:** Superadmin
- **Description:** Temporarily disable an account without deleting it

**Main Flow**

1. Superadmin toggles `is_active` status
2. Locked account cannot log in

### UC-ADM-05: Delete admin account

- **Actor:** Superadmin
- **Precondition:** Cannot delete own account

**Main Flow**

1. Superadmin selects delete account
2. Confirms the action
3. System deletes the account

---

## Module 3 – Organization Information Management

### UC-ORG-01: View organization information

- **Actor:** Guest (website), Superadmin, Editor
- **Description:** Display name, tagline, mission, vision, statistics on the About Us page

**Main Flow**

1. Guest visits the `/about-us` page
2. System returns organization information from the `organization` table

### UC-ORG-02: Update organization information

- **Actor:** Superadmin, Editor
- **Description:** Edit information displayed on the About Us page

**Main Flow**

1. Go to Admin → Settings → Organization Info
2. Edit fields: name, tagline, description, mission, vision, core values, year founded, statistics, social networks
3. Save changes
4. Website updates immediately

---

## Module 4 – Slideshow Management

### UC-SLD-01: View homepage slideshow

- **Actor:** Guest
- **Description:** Display auto-rotating slideshow on homepage

**Main Flow**

1. Guest visits the homepage
2. System fetches active slides, sorted by `order`
3. Displays auto-rotating slideshow + manual navigation

### UC-SLD-02: View slide list in admin

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Slideshow
2. Display all slides including inactive ones, with image preview

### UC-SLD-03: Add new slide

- **Actor:** Superadmin, Editor

**Main Flow**

1. Click "Add Slide"
2. Enter: title, description, CTA button text, CTA link
3. Upload background image
4. Set order, enable/disable status
5. Save

### UC-SLD-04: Edit slide

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select the slide to edit
2. Update information or change image
3. Save changes

### UC-SLD-05: Enable / Disable slide

- **Actor:** Superadmin, Editor
- **Description:** Hide slide from website without deleting

**Main Flow**

1. Toggle `is_active` status
2. Disabled slide is not displayed on website

### UC-SLD-06: Reorder slides

- **Actor:** Superadmin, Editor

**Main Flow**

1. Drag and drop slides to change position
2. Save new order

### UC-SLD-07: Delete slide

- **Actor:** Superadmin

**Main Flow**

1. Select slide to delete
2. Confirm
3. Permanently delete

---

## Module 5 – Map Management (Province)

### UC-MAP-01: View project map on website

- **Actor:** Guest
- **Description:** Display Vietnam map with provinces that have projects highlighted

**Main Flow**

1. Guest views the map on homepage or About Us page
2. System loads province list with `has_project` and `center_count`
3. Provinces with projects are highlighted
4. Guest hovers/clicks on a province → view summary information

### UC-MAP-02: Update province status

- **Actor:** Superadmin, Editor
- **Description:** Mark whether a province has projects and the number of centers

**Main Flow**

1. Go to Admin → Map
2. Select the province to update
3. Toggle `has_project`, enter `center_count`
4. Save → website map updates automatically

---

## Module 6 – Partner Management

### UC-PTN-01: View partner logos on website

- **Actor:** Guest
- **Description:** Display client & partner logos (carousel/grid on homepage, strip in footer)

**Main Flow**

1. Guest views the homepage or any page
2. System displays logos of active partners sorted by `order`

### UC-PTN-02: View partner list in admin

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Partners
2. Display list: name, logo preview, status, order

### UC-PTN-03: Add new partner

- **Actor:** Superadmin, Editor

**Main Flow**

1. Click "Add Partner"
2. Enter name, upload logo, enter website (optional)
3. Set order
4. Save

### UC-PTN-04: Update partner information

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select the partner to edit
2. Update name, logo, or website
3. Save

### UC-PTN-05: Enable / Disable partner display

- **Actor:** Superadmin, Editor

**Main Flow**

1. Toggle `is_active`
2. Disabled partner is not displayed on website

### UC-PTN-06: Reorder partners

- **Actor:** Superadmin, Editor

**Main Flow**

1. Drag and drop to change position
2. Save new order

### UC-PTN-07: Delete partner

- **Actor:** Superadmin

**Main Flow**

1. Select delete, confirm
2. Permanently delete

---

## Module 7 – Operation Field Management

### UC-FLD-01: View operation field list

- **Actor:** Guest, Superadmin, Editor
- **Description:** Display operation fields on homepage and About Us page

**Main Flow**

1. System returns field list sorted by `order`
2. Displays icon + name + short description

### UC-FLD-02: Add new operation field

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Operation Fields → Add New
2. Enter name, slug, icon, short description, order
3. Save

### UC-FLD-03: Update operation field

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select the field to edit
2. Update information
3. Save

### UC-FLD-04: Delete operation field

- **Actor:** Superadmin
- **Description:** Delete the field; programs/solutions/projects belonging to this field will have `field_id = NULL` (not cascade deleted)

**Main Flow**

1. Select delete, confirm
2. System sets `SET NULL field_id` on related tables
3. Delete the operation field

---

## Module 8 – Program Management

### UC-PRG-01: View program list (website)

- **Actor:** Guest
- **Description:** Display published programs at `/programs`

**Main Flow**

1. Guest visits `/programs-solutions/programs`
2. System returns list of published programs
3. Guest can filter by operation field

### UC-PRG-02: View program details (website)

- **Actor:** Guest

**Main Flow**

1. Guest clicks on a program
2. Displays: title, detailed content, operation field, contact CTA
3. Displays related articles linked to this program
4. Displays related programs/solutions

### UC-PRG-03: View program list (admin)

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Programs
2. Display all programs including drafts
3. Filter by operation field, published status

### UC-PRG-04: Create new program

- **Actor:** Superadmin, Editor

**Main Flow**

1. Click "Add Program"
2. Enter: title, slug (auto-generated from title), short description
3. Compose detailed content with rich text editor
4. Upload thumbnail
5. Select operation field
6. Enter meta title, meta description for SEO
7. Save as draft or publish immediately

**Alternative Flow**

- 2a. Slug already exists → show error, request slug change

### UC-PRG-05: Update program

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select the program to edit
2. Modify any field
3. Save changes

### UC-PRG-06: Publish / Unpublish program

- **Actor:** Superadmin, Editor
- **Description:** Toggle visibility status on website

**Main Flow**

1. Click "Publish" or "Unpublish" button
2. `is_published` status changes immediately

### UC-PRG-07: Delete program

- **Actor:** Superadmin
- **Description:** Articles linked to this program will have `program_id = NULL`

**Main Flow**

1. Select delete, confirm
2. System sets `SET NULL program_id` on `article` table
3. Delete the program

---

## Module 9 – Solution Management

### UC-SLT-01: View solution list (website)

- **Actor:** Guest

**Main Flow**

1. Guest visits `/programs-solutions/solutions`
2. System returns list of published solutions
3. Guest can filter by operation field

### UC-SLT-02: View solution details (website)

- **Actor:** Guest

**Main Flow**

1. Guest clicks on a solution
2. Displays: title, content, operation field, contact CTA / download document
3. Displays related articles, related solutions/programs

### UC-SLT-03: View solution list (admin)

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Solutions
2. View all, filter by operation field, status

### UC-SLT-04: Create new solution

- **Actor:** Superadmin, Editor

**Main Flow**

1. Click "Add Solution"
2. Enter: title, slug, short description, rich text content, thumbnail
3. Select operation field
4. Enter SEO meta
5. Save as draft or publish

### UC-SLT-05: Update solution

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select the solution to edit → modify → save

### UC-SLT-06: Publish / Unpublish solution

- **Actor:** Superadmin, Editor

**Main Flow**

1. Toggle `is_published`

### UC-SLT-07: Delete solution

- **Actor:** Superadmin

**Main Flow**

1. Confirm → `SET NULL solution_id` on `article` → delete solution

---

## Module 10 – Project Management

### UC-PRJ-01: View project list (website)

- **Actor:** Guest
- **Description:** Display projects at `/projects` with filter and map

**Main Flow**

1. Guest visits `/projects`
2. System returns published projects
3. Guest filters by: operation field, province/city, year
4. Displays as grid cards: image, name, location, operation field

### UC-PRJ-02: View project details (website)

- **Actor:** Guest

**Main Flow**

1. Guest clicks on a project
2. Displays:
    - **Hero:** image/video + name + location + year + operation field
    - **Overview:** rich text content
    - **Gallery:** project image lightbox
    - **Related articles** linked to the project (SEO)
    - **Suggestions:** 3 other projects

### UC-PRJ-03: View project list (admin)

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Projects
2. View all projects, filter by operation field / province / year / status

### UC-PRJ-04: Create new project

- **Actor:** Superadmin, Editor

**Main Flow**

1. Click "Add Project"
2. Enter: title, slug, overview (rich text), thumbnail
3. Select operation field, province/city, year
4. Upload gallery images (multiple images, with captions)
5. Enter SEO meta
6. Save as draft or publish

**Alternative Flow**

- 2a. Slug already exists → show error

### UC-PRJ-05: Update project information

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select project → edit information → save

### UC-PRJ-06: Manage project gallery images

- **Actor:** Superadmin, Editor
- **Description:** Add, delete, reorder images in the gallery

**Main Flow**

1. Go to project detail page in admin
2. Upload new images (can select multiple images at once)
3. Enter caption for each image
4. Drag and drop to reorder
5. Delete unnecessary images

### UC-PRJ-07: Publish / Unpublish project

- **Actor:** Superadmin, Editor

**Main Flow**

1. Toggle `is_published`

### UC-PRJ-08: Delete project

- **Actor:** Superadmin
- **Description:** Deleting a project also deletes all gallery images (CASCADE)

**Main Flow**

1. Select delete, confirm
2. System deletes `project` + `project_image` CASCADE
3. Sets `SET NULL project_id` on `article` table

---

## Module 11 – Article / News Management

### UC-ART-01: View news list (website)

- **Actor:** Guest

**Main Flow**

1. Guest visits `/news`
2. System returns published articles, sorted by `published_at` newest first
3. Guest filters by category or tag
4. Pagination or lazy load

### UC-ART-02: View article details (website)

- **Actor:** Guest

**Main Flow**

1. Guest clicks on an article
2. Displays: title, publish date, category, full content, tags
3. Social sharing buttons (Facebook, Zalo, X)
4. Related articles
5. Breadcrumb navigation

### UC-ART-03: View articles linked to project / program / solution (website)

- **Actor:** Guest
- **Description:** SEO articles displayed on project/program/solution detail pages

**Main Flow**

1. Guest views a project/program/solution detail page
2. "Related Articles" section displays `article` entries with the corresponding FK
3. Guest clicks → navigates to `/news/:slug` (canonical URL)

### UC-ART-04: View article list (admin)

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Articles
2. View all articles, filter by category / status / keyword
3. Clearly see which articles are linked to which project/program/solution

### UC-ART-05: Create new article

- **Actor:** Superadmin, Editor

**Main Flow**

1. Click "Write New Article"
2. Enter: title, slug (auto-generated)
3. Compose content with rich text editor
4. Upload thumbnail
5. Select category and enter tags
6. Link to a project / program / solution (optional, for SEO)
7. Enter SEO meta title, meta description
8. Choose publish time (immediately or schedule)
9. Save as draft or publish

### UC-ART-06: Update article

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select article → edit → save
2. Can change the link to project/program/solution

### UC-ART-07: Publish / Unpublish article

- **Actor:** Superadmin, Editor

**Main Flow**

1. Toggle `is_published`
2. If publishing for the first time → set `published_at = NOW()`

### UC-ART-08: Delete article

- **Actor:** Superadmin

**Main Flow**

1. Select delete, confirm → delete article

---

## Module 12 – Recruitment Management

### UC-JOB-01: View job position list (website)

- **Actor:** Guest

**Main Flow**

1. Guest visits `/careers`
2. System returns positions with `is_active = true`
3. Filter by: type (full-time/part-time/intern), location
4. Search by keyword
5. Display "New" / "Urgent" badges

### UC-JOB-02: View job position details (website)

- **Actor:** Guest

**Main Flow**

1. Guest clicks on a job position
2. Displays: position title, department, location, salary, deadline, headcount
3. Job description, requirements, benefits
4. Quick application form or link to send CV via email
5. Other open positions

### UC-JOB-03: Apply for a position (website)

- **Actor:** Guest

**Main Flow**

1. Guest fills in the form: full name, email, phone, upload CV
2. System records it in the lead table (or sends email directly)
3. Displays success message

### UC-JOB-04: View position list (admin)

- **Actor:** Superadmin, Editor

**Main Flow**

1. Go to Admin → Recruitment
2. View all positions, filter by `is_active`, type

### UC-JOB-05: Create new job position

- **Actor:** Superadmin, Editor

**Main Flow**

1. Click "Add Position"
2. Enter: position title, slug, department, location, type, salary range, deadline
3. Compose description, requirements, benefits with rich text
4. Mark as "Urgent" if needed
5. Save and activate

### UC-JOB-06: Update job position

- **Actor:** Superadmin, Editor

**Main Flow**

1. Select position → edit → save

### UC-JOB-07: Enable / Disable job position

- **Actor:** Superadmin, Editor
- **Description:** Close/open a job position without deleting

**Main Flow**

1. Toggle `is_active`
2. Disabled position is not displayed on website

### UC-JOB-08: Delete job position

- **Actor:** Superadmin

**Main Flow**

1. Select delete, confirm → permanently delete

---

## Module 13 – Contact Form Management (Lead)

### UC-LED-01: Submit contact form (website)

- **Actor:** Guest
- **Description:** Visitor leaves information for consultation / collaboration
- **Precondition:** Must pass CAPTCHA / Honeypot anti-spam

**Main Flow**

1. Guest fills in the form: full name (*), email (*), phone (*), subject, message, attachment
2. Clicks submit
3. System validates on client + server side
4. Saves lead to DB
5. Sends notification email to admin
6. Displays success message to Guest

**Alternative Flow**

- 3a. Missing required fields → display corresponding errors
- 3b. Invalid email format → show error
- 3c. Attachment exceeds size limit → show error

### UC-LED-02: View lead list (admin)

- **Actor:** Superadmin, Editor, Viewer

**Main Flow**

1. Go to Admin → Contacts
2. Display list: name, email, phone, subject, submission date, read status
3. Filter by `is_read` (read / unread)
4. Show unread count as badge on menu

### UC-LED-03: View lead details

- **Actor:** Superadmin, Editor, Viewer

**Main Flow**

1. Click on the lead to view
2. Display full details: name, email, phone, subject, message, attachment, submission time
3. Automatically mark `is_read = true`

### UC-LED-04: Mark as read / unread

- **Actor:** Superadmin, Editor, Viewer

**Main Flow**

1. Admin manually toggles `is_read` status
2. Used to mark items that need follow-up

### UC-LED-05: Export lead list to CSV

- **Actor:** Superadmin
- **Description:** Download all leads as a CSV file for analysis or CRM import

**Main Flow**

1. Go to Admin → Contacts → Export
2. Select time range (from, to)
3. System generates and downloads CSV file

### UC-LED-06: Delete lead

- **Actor:** Superadmin

**Main Flow**

1. Select the lead to delete, confirm
2. Permanently delete from DB

---

## Module 14 – Media Upload

### UC-UPL-01: Upload image

- **Actor:** Superadmin, Editor
- **Description:** Upload images for thumbnails, slides, gallery, logos
- **Precondition:** File must be jpg / png / webp, size ≤ 5MB

**Main Flow**

1. Admin selects file from device
2. System validates format + size
3. Uploads to cloud storage
4. Returns URL to fill in the corresponding field

**Alternative Flow**

- 2a. Invalid format → show error
- 2b. Exceeds size limit → show error

### UC-UPL-02: Upload attachment

- **Actor:** Guest (from contact form)
- **Description:** Guest attaches CV or documents when contacting
- **Precondition:** File is pdf / doc / docx, size ≤ 10MB

**Main Flow**

1. Guest selects attachment in the form
2. System uploads and returns URL
3. URL is saved to the `lead` table when the form is submitted

---

## Use Case Summary by Actor

### Guest

UC-ORG-01, UC-MAP-01, UC-PTN-01, UC-FLD-01, UC-PRG-01, UC-PRG-02, UC-SLT-01, UC-SLT-02, UC-PRJ-01, UC-PRJ-02, UC-ART-01, UC-ART-02, UC-ART-03, UC-JOB-01, UC-JOB-02, UC-JOB-03, UC-LED-01, UC-UPL-02

### Viewer (in addition to Guest)

UC-AUTH-01~04, UC-LED-02, UC-LED-03, UC-LED-04

### Editor (all Viewer +)

UC-ADM-04 (change own password), UC-ORG-02, UC-SLD-02~06, UC-PTN-02~06, UC-FLD-02~03, UC-PRG-03~06, UC-SLT-03~06, UC-PRJ-03~07, UC-PRJ-06, UC-ART-04~07, UC-JOB-04~07, UC-UPL-01

### Superadmin (full access, additionally)

UC-ADM-01~05, UC-SLD-07, UC-PTN-07, UC-FLD-04, UC-PRG-07, UC-SLT-07, UC-PRJ-08, UC-ART-08, UC-JOB-08, UC-LED-05, UC-LED-06

---

**Total:** 14 modules – 65 use cases

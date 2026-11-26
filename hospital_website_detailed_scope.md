# Hospital Website -- Detailed Project Sitemap & Functional Scope

## 1. Project Overview

The project is a modern, responsive hospital website with an integrated
doctor appointment booking system. Patients will be able to explore
hospital services, browse doctors, book appointments, pay online and
manage their bookings through a patient account.

The platform will include three connected interfaces:

1.  **Public Website** -- information pages and appointment booking.
2.  **Admin Panel** -- central management of doctors, services,
    appointments, patients, payments and website settings.
3.  **Doctor Panel** -- a dedicated workspace for doctors to view
    appointments, patient booking details and manage availability.

### Primary Objectives

-   Make it easy for patients to find the right doctor and book an
    appointment.
-   Show accurate doctor profiles, consultation fees and available time
    slots.
-   Prevent duplicate bookings for the same doctor and time slot.
-   Support secure online payment through Razorpay.
-   Send appointment updates through email, SMS and WhatsApp.
-   Give hospital administrators a central place to manage daily
    operations.
-   Give doctors access only to the appointments and information
    relevant to them.

------------------------------------------------------------------------

## 2. Public Website Sitemap

``` text
HOME
│
├── ABOUT
│
├── SERVICES
│
├── DOCTORS
│
├── BOOK DOCTOR
│
├── PATIENT LOGIN
│
└── CONTACT US
```

### 2.1 Home

**Purpose:** Introduce the hospital and guide visitors towards finding a
service or booking a doctor.

**Suggested sections:**

-   Header with hospital logo and main navigation.
-   Hero section with a clear hospital message and "Book Doctor"
    call-to-action.
-   Quick appointment booking entry point.
-   Featured medical services or specialities.
-   Featured doctors.
-   Why choose the hospital.
-   Hospital facilities and care highlights.
-   Patient testimonials, if supplied and approved by the hospital.
-   Contact information and location.
-   Footer with important links, policies and contact details.

**Key actions:**

-   Browse services.
-   View doctors.
-   Start appointment booking.
-   Open patient login.
-   Contact the hospital.

### 2.2 About

**Purpose:** Explain the hospital, its approach to care and its
facilities.

**Suggested content:**

-   Hospital introduction and background.
-   Mission and vision.
-   Healthcare philosophy and patient-care approach.
-   Facilities and infrastructure.
-   Hospital images, certifications or accreditations, where provided
    and verified.
-   Reasons to choose the hospital.

**Admin content control:** The agreed About page content and images
should be editable through Website Settings or a content management
section.

### 2.3 Services

**Purpose:** Display the hospital's medical services and specialities.

**Suggested functionality:**

-   Service listing with title, image/icon and short description.
-   Service categories or speciality filters, if required.
-   Service detail view or expandable details.
-   Related doctors for each service, where applicable.
-   "Book Doctor" action from a service.

**Admin content control:** Admin users can add, edit, publish, unpublish
and remove services.

**Note:** Individual service entries should be stored as data and
rendered using a reusable page/component. A separate manually coded page
is not required for every service.

### 2.4 Doctors

**Purpose:** Help patients discover and compare available doctors.

**Doctor listing information:**

-   Doctor name and profile photo.
-   Speciality or department.
-   Qualification.
-   Years of experience, if supplied.
-   Consultation fee.
-   Short profile summary.
-   Availability indicator, based on configured schedule.
-   View Profile and Book Appointment actions.

**Suggested search and filters:**

-   Search by doctor name.
-   Filter by speciality/service.
-   Filter by availability, where supported.

**Doctor profile information:**

-   Name and photograph.
-   Qualification and experience.
-   Speciality.
-   Biography or professional introduction.
-   Consultation fee.
-   Available days and time slots.
-   Book Appointment button.

**Admin content control:** Doctor profiles are created and maintained in
the Admin Panel.

### 2.5 Book Doctor

**Purpose:** Provide the complete appointment booking and payment
journey.

**Recommended booking flow:**

1.  **Select service or medical concern** -- patient selects the
    relevant service/speciality or describes the reason for the visit,
    according to the hospital's approved workflow.
2.  **Select doctor** -- show matching doctors and their consultation
    fees.
3.  **Select date** -- show dates on which the selected doctor is
    available.
4.  **Select time slot** -- show only available slots.
5.  **Enter patient details** -- name, mobile number, email and any
    other approved booking fields.
6.  **Review appointment** -- show doctor, service, date, time, patient
    details and total payable amount.
7.  **Payment** -- collect payment through Razorpay, if online payment
    is required.
8.  **Confirmation** -- show the booking reference, appointment details
    and payment status.

**Booking rules:**

-   A slot must be checked again before final confirmation to reduce the
    risk of double-booking.
-   A temporary slot hold may be used during checkout, with an expiry
    time.
-   Payment status must be verified on the server using Razorpay's
    verification/webhook flow.
-   A booking should become confirmed only according to the payment
    policy configured by the hospital.
-   Failed or abandoned payments should not create a confirmed paid
    appointment.
-   Each booking should have a unique appointment/booking reference.
-   Appointment status should be tracked separately from payment status.

**Suggested appointment statuses:**

-   Pending Payment
-   Pending Confirmation (if manual approval is required)
-   Confirmed
-   Cancelled
-   Completed
-   No-show

**Cancellation:** Patients should be able to request or complete
cancellation according to the cancellation window and policy configured
by the hospital. Refund eligibility and refund processing must follow
the agreed business rules.

### 2.6 Patient Login

**Purpose:** Give registered patients a secure account to manage their
appointments.

**Authentication screens and actions:**

-   Register.
-   Login.
-   Logout.
-   Forgot password / password reset.
-   Basic profile management.

**Patient dashboard:**

-   Upcoming appointments.
-   Past appointments.
-   Cancelled appointments.
-   Appointment details.
-   Booking reference.
-   Doctor and service details.
-   Appointment date and time.
-   Payment status.
-   Cancellation action for eligible bookings.

**Patient profile fields (minimum suggested):**

-   Full name.
-   Email address.
-   Mobile number.

Any additional personal or health-related fields should be collected
only when necessary and approved by the hospital.

### 2.7 Contact Us

**Purpose:** Allow visitors to contact the hospital.

**Suggested sections:**

-   Hospital address.
-   Phone number.
-   Email address.
-   Working hours.
-   Contact/enquiry form.
-   Map or directions link.
-   Emergency contact information, only if supplied and verified by the
    hospital.

**Enquiry form fields:**

-   Name.
-   Phone number.
-   Email.
-   Subject or enquiry type.
-   Message.

Form submissions should be stored securely and made available to
authorised admin users or sent to the configured hospital email address.

------------------------------------------------------------------------

## 3. Admin Panel Sitemap

``` text
ADMIN PANEL
│
├── Dashboard
├── Manage Doctors
├── Manage Services
├── Manage Appointments
├── Manage Patients
├── Manage Payments
├── Notification Settings
└── Website Settings
```

The Admin Panel will be protected by authentication and role-based
permissions. Only authorised users should be able to access
administrative data and actions.

### 3.1 Dashboard

**Purpose:** Give administrators a quick overview of hospital booking
activity.

**Suggested dashboard information:**

-   Total appointments.
-   Today's appointments.
-   Upcoming appointments.
-   Pending appointments.
-   Confirmed appointments.
-   Cancelled appointments.
-   Total registered patients.
-   Active doctors.
-   Payment summary.
-   Recent bookings and activity.

Dashboard figures should be calculated from actual database records and
respect the selected date range and user permissions.

### 3.2 Manage Doctors

**Purpose:** Manage doctor profiles shown on the public website.

**Features:**

-   Add a new doctor.
-   Edit doctor details.
-   Upload or change profile photo.
-   Add qualifications and experience.
-   Assign speciality/service.
-   Set consultation fee.
-   Add biography and profile information.
-   Activate or deactivate a doctor.
-   Control whether a profile is visible on the public website.
-   Configure or access doctor availability.

**Suggested doctor record fields:**

-   Doctor ID.
-   Full name.
-   Profile image.
-   Qualification.
-   Speciality/service association.
-   Experience.
-   Biography.
-   Consultation fee.
-   Login/account association, where the doctor has panel access.
-   Active/inactive status.

### 3.3 Manage Services

**Purpose:** Manage the services and specialities displayed on the
website.

**Features:**

-   Add service.
-   Edit service.
-   Upload service image or icon.
-   Add title and description.
-   Publish/unpublish service.
-   Associate doctors with relevant services.
-   Set display order.

**Suggested service record fields:**

-   Service ID.
-   Service name.
-   Short description.
-   Full description.
-   Image/icon.
-   Associated doctors.
-   Published status.
-   Display order.

### 3.4 Manage Appointments

**Purpose:** Give authorised staff a complete view of appointment
bookings.

**Features:**

-   View all appointments.
-   View appointment details.
-   Search by booking ID or patient name.
-   Filter by doctor.
-   Filter by service.
-   Filter by appointment date.
-   Filter by appointment status.
-   View when the booking was created.
-   View appointment date and time.
-   View payment status.
-   Update appointment status according to permissions.
-   View cancellation details.
-   View notification dispatch status, where available.

**Suggested appointment details:**

-   Booking reference.
-   Patient name and contact details.
-   Selected service.
-   Assigned doctor.
-   Appointment date.
-   Appointment time.
-   Consultation fee.
-   Payment status and transaction reference.
-   Appointment status.
-   Booking creation timestamp.
-   Cancellation timestamp/reason, if applicable.

### 3.5 Manage Patients

**Purpose:** Allow authorised staff to find patient accounts and review
relevant booking history.

**Features:**

-   View registered patient list.
-   Search by name, email or mobile number.
-   View patient profile.
-   View appointment history.
-   View account status.
-   Access only the personal information required for hospital
    operations.

Access to patient information should be restricted by role and follow
the hospital's privacy and data-handling requirements.

### 3.6 Manage Payments

**Purpose:** Track payments associated with appointments.

**Features:**

-   View payment records.
-   Search by booking reference or Razorpay payment/order reference.
-   Filter by payment date and status.
-   View amount and currency.
-   View payment success or failure.
-   View linked appointment.
-   View refund status, where refunds are supported.
-   Reconcile payment records with verified Razorpay events.

**Important:** The system must not treat a browser redirect or
client-side success message as proof of payment. Payment verification
must happen securely on the server.

### 3.7 Notification Settings

**Purpose:** Configure the communication channels used for booking
updates.

#### Email Configuration

-   SMTP host.
-   SMTP port.
-   SMTP username.
-   SMTP password or app-specific credential.
-   Sender name.
-   Sender email.
-   Test email action.
-   Email notification enable/disable controls.

Email sending will use Nodemailer with the configured SMTP/email
provider.

#### SMS Configuration

-   MSG91 authentication/API configuration.
-   Sender ID, where applicable.
-   Approved template identifiers.
-   SMS notification enable/disable controls.
-   Test SMS action, where supported.

#### WhatsApp Configuration

-   MSG91 WhatsApp or the selected approved WhatsApp Business API
    provider.
-   Provider credentials and configuration.
-   Approved WhatsApp template identifiers.
-   Template variables and message mapping.
-   WhatsApp notification enable/disable controls.
-   Test message action, where supported.

**Notification events:**

-   New appointment booking.
-   Successful payment.
-   Appointment confirmation.
-   Appointment cancellation.
-   Appointment status update.
-   Optional appointment reminder.
-   New booking alert to hospital staff.

**Delivery tracking:** Store the notification channel, event, recipient
reference, provider message ID (when available), sent time and
delivery/error status. Avoid storing unnecessary sensitive message
content.

**Important:** WhatsApp delivery requires the relevant business account
setup and approved templates. Provider charges and approval requirements
are separate from development.

### 3.8 Website Settings

**Purpose:** Manage agreed website content and general configuration.

**Suggested features:**

-   Hospital name and logo.
-   Contact details.
-   Address and working hours.
-   Homepage content sections.
-   About page content.
-   Contact page information.
-   Social media links.
-   Footer content.
-   SEO title and meta description for supported pages.
-   Basic website configuration.

The exact editable sections should be finalised during design and
development.

------------------------------------------------------------------------

## 4. Doctor Panel Sitemap

``` text
DOCTOR PANEL
│
├── Dashboard
├── My Appointments
├── Patient Details
├── My Availability
└── My Profile
```

The Doctor Panel will use a separate doctor login experience or a
role-based login route. A doctor should only access their own
appointments and the patient information needed for those appointments.

### 4.1 Dashboard

**Suggested information:**

-   Today's appointments.
-   Upcoming appointments.
-   Pending appointments, if applicable.
-   Recently updated appointments.
-   Quick access to availability.

### 4.2 My Appointments

**Features:**

-   View appointments assigned to the logged-in doctor.
-   View today's appointments.
-   View upcoming appointments.
-   View past appointments.
-   Filter by date and status.
-   Open appointment details.
-   Update permitted appointment statuses.

### 4.3 Patient Details

**Features:**

-   View patient name and relevant contact information.
-   View booking reference.
-   View appointment date and time.
-   View selected service or reason for visit, if collected.
-   View relevant booking notes, if included in the approved scope.

The doctor should not have unrestricted access to all patient accounts
or unrelated appointments.

### 4.4 My Availability

**Features:**

-   Set available days.
-   Set working hours.
-   Configure appointment slot duration.
-   Add breaks.
-   Block specific dates.
-   Add holidays or leave.
-   View scheduled availability.

Changes to availability must not silently invalidate existing confirmed
appointments. The system should warn authorised users when a change
conflicts with existing bookings.

### 4.5 My Profile

**Features:**

-   View profile information.
-   Update permitted profile fields.
-   Update profile photograph, if enabled.
-   View speciality and qualifications.
-   Change password or access account security options.

Some profile fields, such as verified qualifications or consultation
fees, may remain admin-controlled.

------------------------------------------------------------------------

## 5. Booking Notifications

When a patient makes a booking, the system should trigger the configured
notification workflow.

  --------------------------------------------------------------------------
  Event          Patient Email  Patient SMS    Patient        Admin Alert
                                               WhatsApp       
  -------------- -------------- -------------- -------------- --------------
  Booking        Yes            Yes            Yes            Yes
  received                                                    

  Payment        Configurable   Configurable   Configurable   Configurable
  successful                                                  

  Appointment    Yes            Yes            Yes            Optional
  confirmed                                                   

  Appointment    Yes            Yes            Yes            Yes
  cancelled                                                   

  Appointment    Optional       Optional       Optional       No
  reminder                                                    
  --------------------------------------------------------------------------

The exact combination of messages, timing and templates should be
approved by the hospital.

### Example Confirmation Information

A confirmation message should include:

-   Patient name.
-   Booking reference.
-   Doctor name.
-   Service/speciality.
-   Appointment date.
-   Appointment time.
-   Hospital name and contact details.
-   Payment status, where relevant.

Messages should be generated from verified booking records. The system
should not send a confirmed-appointment message until the appointment
has actually reached the confirmed state.

------------------------------------------------------------------------

## 6. Technology Stack

  -----------------------------------------------------------------------
  Layer                   Proposed Technology     Responsibility
  ----------------------- ----------------------- -----------------------
  Web framework           Next.js                 Website, routing and
                                                  server-side application
                                                  logic

  UI library              React                   Reusable interface
                                                  components

  Styling                 Tailwind CSS            Responsive design and
                                                  styling

  Database                Supabase PostgreSQL     Users, doctors,
                                                  services, schedules,
                                                  bookings and payments

  File storage            Supabase Storage        Doctor photos, service
                                                  images and approved
                                                  website assets

  Authentication          Supabase Auth or an     Patient, admin and
                          agreed secure           doctor sign-in
                          authentication          
                          implementation          

  Email                   Nodemailer + SMTP       Email notifications
                          provider                

  SMS                     MSG91                   SMS notifications

  WhatsApp                MSG91 WhatsApp /        WhatsApp notifications
                          approved WhatsApp       
                          Business API            

  Payment                 Razorpay                Online appointment
                                                  payments
  -----------------------------------------------------------------------

### Integration and Security Principles

-   Keep API secrets and payment credentials on the server.
-   Use environment variables for secret configuration.
-   Apply authentication and role-based authorisation.
-   Apply Supabase Row Level Security (RLS) policies to protect records.
-   Verify Razorpay payments and webhook signatures server-side.
-   Validate all user-submitted data.
-   Protect booking creation and slot allocation against duplicate
    requests.
-   Record important administrative changes.
-   Use HTTPS in production.

------------------------------------------------------------------------

## 7. Suggested Core Database Entities

The final schema should be confirmed during technical planning. The
following entities provide a starting point.

  Entity                       Purpose
  ---------------------------- ------------------------------------------------------
  profiles                     Common user profile and role reference
  doctors                      Doctor professional profile and public information
  services                     Hospital services and specialities
  doctor_services              Relationship between doctors and services
  doctor_schedules             Weekly working hours and availability
  blocked_slots                Breaks, holidays, leave and unavailable periods
  appointments                 Patient booking and appointment status
  appointment_status_history   History of appointment status changes
  payments                     Razorpay order/payment references and payment status
  notification_logs            Email, SMS and WhatsApp dispatch records
  enquiries                    Contact form submissions
  website_settings             Editable hospital website settings

### Important Data Relationships

-   A doctor can be associated with multiple services, if the hospital
    permits it.
-   A service can have multiple doctors.
-   A patient can have multiple appointments.
-   Each appointment is assigned to a doctor and a service, according to
    the booking model.
-   A payment record is linked to an appointment.
-   Notification records are linked to the relevant booking or event.
-   Doctor schedules and blocked slots determine bookable availability.

------------------------------------------------------------------------

## 8. User Roles & Access Permissions

  ------------------------------------------------------------------------------------
  Feature           Super Admin     Hospital Staff               Doctor        Patient
  -------------- -------------- ------------------ -------------------- --------------
  View admin                Yes   Permission-based                   No             No
  dashboard                                                             

  Manage doctors            Yes   Permission-based Own profile only, if             No
                                                                enabled 

  Manage                    Yes   Permission-based                   No             No
  services                                                              

  View all                  Yes   Permission-based                   No             No
  appointments                                                          

  View assigned             Yes   Permission-based                  Yes       Own only
  appointments                                                          

  Manage patient            Yes   Permission-based   Assigned/necessary    Own profile
  records                                                  details only 

  View all                  Yes   Permission-based                   No    Own payment
  payments                                                                      status

  Manage                    Yes   Permission-based                   No             No
  notification                                                          
  settings                                                              

  Manage website            Yes   Permission-based                   No             No
  content                                                               

  Manage own                Yes   Permission-based      Yes, if enabled             No
  availability                                                          

  Cancel own                 No   Permission-based                   No            Yes
  eligible                                                              
  booking                                                               
  ------------------------------------------------------------------------------------

Permissions should be enforced by the backend and database policies, not
merely by hiding interface elements.

------------------------------------------------------------------------

## 9. Design & User Experience Direction

### Visual Direction

-   Modern healthcare-focused design.
-   Primary colours: blue and white.
-   Clean typography and clear visual hierarchy.
-   Professional doctor profile cards.
-   Easy-to-read appointment forms.
-   Clear booking progress indicators.
-   Consistent buttons, icons, spacing and form styles.
-   Original visual design rather than a generic pre-built template
    appearance.

### Responsive Requirements

The website and panels should work on:

-   Desktop computers.
-   Tablets.
-   Mobile phones.

### Usability Requirements

-   Keep the main navigation simple.
-   Make "Book Doctor" easy to find.
-   Keep appointment steps clear and predictable.
-   Show useful validation and error messages.
-   Provide loading, success and failure states.
-   Make payment status and appointment status easy to understand.

------------------------------------------------------------------------

## 10. Security, Privacy & Reliability

The platform will handle personal information and appointment data. The
implementation should include:

-   Secure authentication and password handling.
-   Role-based access control.
-   Supabase RLS policies.
-   Server-side validation and authorisation.
-   Secure storage of integration credentials.
-   Payment verification and webhook handling.
-   Protection against duplicate appointment submissions.
-   Controlled access to patient information.
-   Appropriate audit logs.
-   Database backup and recovery arrangements according to the hosting
    plan.
-   Privacy policy, terms and consent wording approved by the hospital.

The hospital should confirm applicable healthcare, privacy,
record-retention and regulatory requirements before launch. The website
should collect only the information required for the agreed service.

------------------------------------------------------------------------

## 11. Testing & Quality Assurance

The following flows should be tested before launch:

### Public Website

-   Navigation and responsive layouts.
-   About, Services, Doctors and Contact content.
-   Doctor search and profile display.
-   Contact form validation and submission.

### Appointment Booking

-   Doctor and service selection.
-   Date and time availability.
-   Slot conflict and duplicate booking checks.
-   Patient detail validation.
-   Successful Razorpay payment.
-   Failed, cancelled and abandoned payment.
-   Booking confirmation and reference generation.
-   Appointment cancellation and applicable refund workflow.

### Notifications

-   Email configuration and delivery.
-   MSG91 SMS configuration and delivery.
-   WhatsApp provider configuration and template delivery.
-   Correct booking details in messages.
-   Failed notification logging and retry handling, if included.

### Admin and Doctor Panels

-   Role and permission checks.
-   Doctor and service management.
-   Appointment filters and status changes.
-   Patient access restrictions.
-   Payment record visibility.
-   Doctor schedule and availability changes.

### Patient Account

-   Registration and login.
-   Password reset.
-   Appointment history.
-   Appointment details.
-   Eligible cancellation.

------------------------------------------------------------------------

## 12. Project Scope Summary

  -----------------------------------------------------------------------
  Area                                Included Scope
  ----------------------------------- -----------------------------------
  Public Website                      7 main navigation pages

  Patient Account                     Login, registration, dashboard and
                                      appointment management

  Admin Panel                         8 main modules

  Doctor Panel                        5 main modules

  Booking System                      Doctor, service, date, time and
                                      patient details

  Payment Gateway                     Razorpay integration

  Email Notifications                 Nodemailer with SMTP provider

  SMS Notifications                   MSG91 integration

  WhatsApp Notifications              Approved WhatsApp API integration

  Database                            Supabase PostgreSQL

  File Storage                        Supabase Storage

  Responsive Design                   Desktop, tablet and mobile

  Basic SEO                           Metadata, clean URLs and sitemap
                                      for public pages

  Quality Assurance                   Functional, integration and
                                      permission testing
  -----------------------------------------------------------------------

**Public website navigation: 7 main pages.** The Admin Panel and Doctor
Panel are authenticated application areas, not additional public
navigation pages. Dynamic doctor and service records will use reusable
templates rather than requiring a separately coded page for every
record.

------------------------------------------------------------------------

## 13. Items to Confirm with the Hospital Before Development

1.  Hospital name, logo, brand assets and preferred typography.
2.  Final list of services and specialities.
3.  Doctor details, qualifications, photos and consultation fees.
4.  Whether patients select a service first or a doctor first.
5.  Appointment duration and slot interval.
6.  Doctor working hours, breaks, holidays and leave process.
7.  Whether payment is mandatory before an appointment is confirmed.
8.  Cancellation window, refund policy and rescheduling rules.
9.  Required patient information and any consent wording.
10. Email SMTP provider and credentials.
11. MSG91 account, SMS sender ID and approved templates.
12. WhatsApp Business/API setup and approved templates.
13. Razorpay account and credentials.
14. Hosting, domain and deployment access.
15. Admin staff and doctor accounts/permissions.
16. Privacy policy, terms and other legal content.

------------------------------------------------------------------------

## 14. Items Not Included Unless Separately Approved

The following are outside the current base scope unless specifically
added to the project:

-   Video consultation or telemedicine.
-   Electronic medical records (EMR/EHR).
-   Prescriptions and pharmacy management.
-   Lab reports and diagnostic integrations.
-   Insurance claims.
-   Hospital bed, ward or inventory management.
-   Multi-branch hospital management.
-   Advanced patient medical history.
-   Third-party HIS/HMS integrations.
-   Native Android or iOS applications.

These can be estimated separately if required.

------------------------------------------------------------------------

## 15. Final Project Structure

The agreed high-level structure is:

``` text
HOSPITAL WEBSITE
│
├── HOME
├── ABOUT
├── SERVICES
├── DOCTORS
├── BOOK DOCTOR
├── PATIENT LOGIN
└── CONTACT US


ADMIN PANEL
│
├── Dashboard
├── Manage Doctors
├── Manage Services
├── Manage Appointments
├── Manage Patients
├── Manage Payments
├── Notification Settings
└── Website Settings


DOCTOR PANEL
│
├── Dashboard
├── My Appointments
├── Patient Details
├── My Availability
└── My Profile
```

**This document defines the proposed sitemap and functional scope.**
Final design, timeline, commercial quotation, third-party subscription
costs, revision limits and post-launch support should be agreed
separately before development begins.

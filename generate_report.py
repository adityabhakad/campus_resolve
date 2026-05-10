from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "Campus Resolve Project Report.docx"
ASSETS = ROOT / "report_assets"
ASSETS.mkdir(exist_ok=True)


def draw_box(ax, xy, text, w=2.8, h=0.75, fc="#eef6ff", ec="#2563eb", fontsize=9):
    x, y = xy
    patch = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.06", fc=fc, ec=ec, lw=1.5)
    ax.add_patch(patch)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fontsize, wrap=True)
    return (x, y, w, h)


def arrow(ax, a, b):
    ax.annotate("", xy=b, xytext=a, arrowprops=dict(arrowstyle="->", lw=1.4, color="#334155"))


def save_fig(name):
    path = ASSETS / name
    plt.savefig(path, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def make_diagrams():
    fig, ax = plt.subplots(figsize=(9, 5.2))
    ax.set_axis_off()
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    draw_box(ax, (0.4, 4.6), "React + Vite Frontend\nHome, Login, Register, Dashboards", 3, 0.9, "#fefce8", "#ca8a04")
    draw_box(ax, (3.8, 4.6), "Axios API Client\nJWT cookie + Bearer fallback", 2.6, 0.9, "#f0fdf4", "#16a34a")
    draw_box(ax, (7, 4.6), "Express API Server\nAuth, Complaint, Upload Routes", 2.7, 0.9, "#eff6ff", "#2563eb")
    draw_box(ax, (7, 3.05), "Controllers + Middleware\nRBAC, validation, status updates", 2.7, 0.9, "#f5f3ff", "#7c3aed")
    draw_box(ax, (7, 1.5), "MongoDB + Mongoose\nUsers, Complaints, Comments", 2.7, 0.9, "#ecfdf5", "#059669")
    draw_box(ax, (3.8, 1.5), "Uploads Folder\nEvidence and comment images", 2.6, 0.9, "#fff7ed", "#ea580c")
    draw_box(ax, (0.4, 1.5), "Role Portals\nStudent, Staff, Admin", 3, 0.9, "#f8fafc", "#475569")
    arrow(ax, (3.45, 5.05), (3.8, 5.05))
    arrow(ax, (6.4, 5.05), (7, 5.05))
    arrow(ax, (8.35, 4.6), (8.35, 3.95))
    arrow(ax, (8.35, 3.05), (8.35, 2.4))
    arrow(ax, (7, 3.45), (6.4, 2))
    arrow(ax, (3.4, 1.95), (3.8, 1.95))
    ax.set_title("Figure 1. Campus Resolve System Architecture", fontsize=13, fontweight="bold")
    arch = save_fig("architecture.png")

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.set_axis_off()
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    boxes = []
    for txt, x, y in [
        ("Start / Login", 4, 7),
        ("Student submits complaint\ncategory, location, images", 3.3, 5.9),
        ("Backend validates JWT\nand stores complaint", 3.3, 4.8),
        ("Auto route by category\nfaculty / warden / librarian / canteen / staff", 2.8, 3.7),
        ("Staff/Admin reviews\nand updates status", 3.3, 2.6),
        ("Discussion timeline\ncomments and evidence", 3.3, 1.5),
        ("Resolved / Rejected\nstudent notified", 3.3, 0.4),
    ]:
        boxes.append(draw_box(ax, (x, y), txt, 3.4, 0.68, "#f8fafc", "#0f172a", 8.5))
    for b1, b2 in zip(boxes, boxes[1:]):
        arrow(ax, (b1[0] + b1[2] / 2, b1[1]), (b2[0] + b2[2] / 2, b2[1] + b2[3]))
    ax.set_title("Figure 2. Complaint Resolution Flowchart", fontsize=13, fontweight="bold")
    flow = save_fig("flowchart.png")

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.set_axis_off()
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.text(2.5, 5.6, "Student", ha="center", fontweight="bold")
    ax.text(7.5, 5.6, "System", ha="center", fontweight="bold")
    ax.plot([5, 5], [0.4, 5.4], color="#cbd5e1", lw=2)
    prev = None
    for i, (s, t) in enumerate(
        zip(
            ["Open portal", "Register/Login", "Create complaint", "Upload evidence", "Track status", "Chat with staff"],
            ["Authenticate", "Extract GPS metadata", "Save complaint", "Assign department", "Show notifications", "Close after resolution"],
        )
    ):
        y = 4.8 - i * 0.75
        draw_box(ax, (0.8, y), s, 3.1, 0.5, "#fff7ed", "#ea580c", 8)
        draw_box(ax, (6, y), t, 3.1, 0.5, "#eff6ff", "#2563eb", 8)
        arrow(ax, (3.9, y + 0.25), (6, y + 0.25))
        if prev:
            arrow(ax, (2.35, prev), (2.35, y + 0.5))
            arrow(ax, (7.55, prev), (7.55, y + 0.5))
        prev = y
    ax.set_title("Figure 3. Student Complaint Activity Diagram", fontsize=13, fontweight="bold")
    student_act = save_fig("student_activity.png")

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.set_axis_off()
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    for txt, x, y in [
        ("Admin views analytics", 0.7, 4.8),
        ("Filter/search complaints", 0.7, 3.9),
        ("Assign staff or change priority", 0.7, 3),
        ("Staff receives assigned issue", 5.9, 3.9),
        ("Staff updates status", 5.9, 3),
        ("Admin/Staff add notes", 3.3, 2.1),
        ("Resolved with remarks", 3.3, 1.2),
    ]:
        draw_box(ax, (x, y), txt, 3.4, 0.55, "#f8fafc", "#334155", 8)
    arrow(ax, (2.4, 4.8), (2.4, 4.45))
    arrow(ax, (2.4, 3.9), (2.4, 3.55))
    arrow(ax, (4.1, 3.27), (5.9, 4.18))
    arrow(ax, (7.6, 3.9), (7.6, 3.55))
    arrow(ax, (7.6, 3), (6.7, 2.65))
    arrow(ax, (5, 2.1), (5, 1.75))
    ax.set_title("Figure 4. Admin and Staff Activity Diagram", fontsize=13, fontweight="bold")
    staff_act = save_fig("admin_staff_activity.png")

    fig, ax = plt.subplots(figsize=(8.5, 5))
    ax.set_axis_off()
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    draw_box(ax, (0.4, 4.5), "Student", 1.8, 0.7, "#fef2f2", "#dc2626")
    draw_box(ax, (0.4, 2.5), "Staff/Admin", 1.8, 0.7, "#fef2f2", "#dc2626")
    draw_box(ax, (3.5, 3.5), "Campus Resolve\nApplication", 2.8, 1.1, "#eff6ff", "#2563eb")
    draw_box(ax, (7.4, 4.5), "Users DB", 1.9, 0.7, "#ecfdf5", "#059669")
    draw_box(ax, (7.4, 3.3), "Complaints DB", 1.9, 0.7, "#ecfdf5", "#059669")
    draw_box(ax, (7.4, 2.1), "Uploads Storage", 1.9, 0.7, "#ecfdf5", "#059669")
    arrow(ax, (2.2, 4.85), (3.5, 4.2))
    arrow(ax, (2.2, 2.85), (3.5, 3.85))
    arrow(ax, (6.3, 4.2), (7.4, 4.85))
    arrow(ax, (6.3, 4), (7.4, 3.65))
    arrow(ax, (6.3, 3.75), (7.4, 2.45))
    arrow(ax, (3.5, 3.75), (2.2, 2.85))
    arrow(ax, (3.5, 4.05), (2.2, 4.85))
    ax.set_title("Figure 5. Level-0 Data Flow Diagram", fontsize=13, fontweight="bold")
    dfd = save_fig("dfd.png")
    return arch, flow, student_act, staff_act, dfd


rels = []
image_id = 1


def xml_text(text):
    return escape(str(text)).replace("\n", "<w:br/>")


def p(text="", style=None, align=None, bold=False, italic=False, size=None, page_break=False):
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    rpr = []
    if bold:
        rpr.append("<w:b/>")
    if italic:
        rpr.append("<w:i/>")
    if size:
        rpr.append(f'<w:sz w:val="{size}"/>')
    br = '<w:r><w:br w:type="page"/></w:r>' if page_break else ""
    return f'<w:p><w:pPr>{"".join(ppr)}</w:pPr><w:r><w:rPr>{"".join(rpr)}</w:rPr><w:t xml:space="preserve">{xml_text(text)}</w:t></w:r>{br}</w:p>'


def heading(text, level=1):
    return p(text, f"Heading{level}", bold=True, size=32 if level == 1 else 28)


def bullet(text):
    return f'<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">{xml_text(text)}</w:t></w:r></w:p>'


def table(rows):
    out = ['<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>']
    for row_i, row in enumerate(rows):
        out.append("<w:tr>")
        for cell in row:
            shade = '<w:shd w:fill="D9EAF7"/>' if row_i == 0 else ""
            out.append(f"<w:tc><w:tcPr>{shade}</w:tcPr>{p(cell, bold=(row_i == 0))}</w:tc>")
        out.append("</w:tr>")
    out.append("</w:tbl>")
    return "".join(out)


def image(path, caption=None, width_in=5.8):
    global image_id
    rid = f"rId{image_id}"
    ext = Path(path).suffix.lower().replace(".", "") or "png"
    dest = f"media/image{image_id}.{ext}"
    rels.append((rid, Path(path), dest))
    image_id += 1
    cx = int(width_in * 914400)
    cy = int(cx * 0.56)
    name = escape(Path(path).name)
    drawing = f'''<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/><wp:docPr id="{image_id}" name="{name}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="{name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'''
    return drawing + (p(caption, align="center", italic=True) if caption else "")


def build_body():
    arch, flow, student_act, staff_act, dfd = make_diagrams()
    screens = [p for p in [ROOT / "frontend/public/hero-dashboard.png", ROOT / "frontend/src/assets/hero.png"] if p.exists()]
    body = []
    body += [p("A MINI PROJECT REPORT ON", align="center", bold=True, size=30), p('"CAMPUS RESOLVE"', align="center", bold=True, size=36), p("SUBMITTED TO", align="center", bold=True), p("ZEAL COLLEGE OF ENGINEERING AND RESEARCH, PUNE", align="center", bold=True), p("IN THE FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE", align="center"), p("OF", align="center"), p("BACHELOR'S OF ENGINEERING (ELECTRONICS AND COMPUTER ENGINEERING)", align="center", bold=True), p("SUBMITTED BY", align="center", bold=True)]
    body.append(table([["Name", "Exam Seat No"], ["Aditya Bhakad", "T171004"], ["Kshitij Awaghad", "T171002"], ["Shlok Jadhav", "T171021"]]))
    body += [p("DEPARTMENT OF ELECTRONICS AND COMPUTER ENGINEERING", align="center", bold=True), p("ZEAL COLLEGE OF ENGINEERING & RESEARCH", align="center", bold=True), p("NARHE, PUNE - 411041", align="center"), p("2025-2026", align="center", page_break=True)]
    body += [heading("CERTIFICATE"), p("This is to certify that the Mini Project report entitled"), p('"CAMPUS RESOLVE"', align="center", bold=True), p("submitted by the following group members:"), table([["Name", "Exam Seat No"], ["Aditya Bhakad", "T171004"], ["Kshitij Awaghad", "T171002"], ["Shlok Jadhav", "T171021"]]), p("is a bonafide work carried out by the students of this institute under the guidance of __________________________ and is approved for the fulfilment of the requirement of Zeal College of Engineering & Research, Pune, for the award of the degree of Bachelor of Engineering (Electronics and Computer Engineering)."), p("\n\n(Prof. ____________________)                         (Prof. ____________________)"), p("Guide                                                     Head of the Department"), p("(Electronics & Computer Engineering)                    (Electronics & Computer Engineering)"), p("Place : Pune"), p("Date  : ", page_break=True)]
    body += [heading("ACKNOWLEDGEMENT"), p("It gives us immense pleasure to present this Mini Project report on Campus Resolve. We express our sincere gratitude to our project guide, the Head of Department, Principal, faculty members, laboratory staff, and all classmates who supported us during the planning, development, testing, and documentation of this project."), p("We are especially thankful for the academic environment provided by Zeal College of Engineering and Research, Pune. The project helped us understand full-stack web application development, role-based access control, database design, secure authentication, REST API development, and modern user interface design."), p("We also thank our peers for their useful suggestions during testing and review. Their feedback helped us improve the usability of student, staff, and admin workflows."), p("With sincere gratitude, we acknowledge every individual who contributed directly or indirectly to the successful completion of this Mini Project report.", page_break=True)]
    body += [heading("ABSTRACT"), p("Campus Resolve is a full-stack web-based campus complaint management and issue resolution platform. The system is designed to improve communication between students, staff members, and administration by replacing informal complaint handling with a transparent, role-based, and trackable workflow."), p("The application allows students to register, log in securely, submit complaints with category, location, image evidence, optional anonymity, and GPS metadata extracted from uploaded images. Complaints are automatically routed to responsible departments such as faculty, hostel warden, librarian, canteen manager, or general staff. Staff members can view assigned complaints, communicate with students, add internal notes, update status, pin important issues, and mark issues as resolved. Administrators can monitor all complaints through analytics, manage students and staff, assign complaints, change priorities, and maintain account status."), p("The frontend is developed using React.js with Vite, Tailwind CSS, Zustand, Recharts, Framer Motion, Lucide React, and Axios. The backend uses Node.js, Express.js, MongoDB, Mongoose, JWT authentication, cookie-based sessions, bcrypt password hashing, Multer file uploads, and role-based middleware."), p("Keywords: Campus Resolve, Complaint Management System, MERN Stack, Role-Based Access Control, MongoDB, React, Express, JWT, Campus Administration.", page_break=True)]
    body += [heading("TABLE OF CONTENTS"), table([["Chapter", "Title", "Page No."], ["1", "Introduction", "10"], ["2", "Literature Review", "13"], ["3", "System Analysis & Requirements", "16"], ["4", "System Architecture & Design", "20"], ["5", "Implementation & Methodology", "24"], ["6", "Results & Discussion", "29"], ["7", "Advantages, Limitations & Applications", "32"], ["8", "Future Scope", "34"], ["9", "Conclusion", "35"], ["10", "References", "36"]]), heading("LIST OF ABBREVIATIONS"), table([["Abbreviation", "Full Form"], ["API", "Application Programming Interface"], ["CRUD", "Create, Read, Update, Delete"], ["DFD", "Data Flow Diagram"], ["JWT", "JSON Web Token"], ["MERN", "MongoDB, Express.js, React.js, Node.js"], ["RBAC", "Role-Based Access Control"], ["REST", "Representational State Transfer"], ["UI", "User Interface"], ["UX", "User Experience"]]), heading("LIST OF TABLES"), table([["Table No.", "Title", "Page No."], ["Table 1", "Comparison of Existing Complaint Handling Systems", "15"], ["Table 2", "Software and Technology Requirements", "18"], ["Table 3", "Database Collections and Purpose", "21"], ["Table 4", "API Route Summary", "25"], ["Table 5", "System Testing Results", "30"]]), heading("LIST OF FIGURES"), table([["Figure No.", "Title", "Page No."], ["Figure 1", "Campus Resolve System Architecture", "20"], ["Figure 2", "Complaint Resolution Flowchart", "22"], ["Figure 3", "Student Complaint Activity Diagram", "23"], ["Figure 4", "Admin and Staff Activity Diagram", "23"], ["Figure 5", "Level-0 Data Flow Diagram", "24"]]), p("", page_break=True)]

    add_chapters(body, arch, flow, student_act, staff_act, dfd, screens)
    return body


def add_bullets(body, items):
    for item in items:
        body.append(bullet(item))


def add_chapters(body, arch, flow, student_act, staff_act, dfd, screens):
    body += [heading("CHAPTER 1: INTRODUCTION"), heading("Background", 2), p("Modern educational institutes need a reliable way to collect, track, and resolve campus issues. In many colleges, complaints related to hostel facilities, academics, library services, canteen operations, and general infrastructure are communicated informally through verbal messages, paper notes, or scattered messaging groups. Such methods often lack accountability, tracking, and prioritization."), p("Campus Resolve addresses this gap by providing a centralized digital platform where students can raise issues and administrators can monitor the entire resolution process. The system supports role-based portals for students, staff, and administrators, making it suitable for real college workflows."), heading("Problem Statement", 2), p("The traditional complaint handling process in a campus environment is slow, difficult to monitor, and dependent on manual communication. Students may not know whom to contact, staff members may not receive complete information, and administrators may not have analytics to identify repeated problems. Therefore, there is a need for a secure web-based platform that records complaints, routes them to the correct department, enables communication, and provides administrative visibility."), heading("Objectives", 2)]
    add_bullets(body, ["To design a web-based campus complaint management system for students, staff, and administrators.", "To provide secure registration, login, logout, and password change functionality.", "To support image-based complaint evidence and location details.", "To automatically route complaints based on categories such as Academics, Hostel, Library, Canteen, and Others.", "To enable staff and administrators to update complaint status, add remarks, and communicate with students.", "To provide analytics and management tools for administrators."])
    body += [heading("Scope of Project", 2), p("The project scope includes frontend interfaces, backend APIs, database models, authentication, authorization, complaint submission, image upload, comment timeline, status updates, staff management, student management, and administrative analytics. The current implementation is a working web application and can be deployed using platforms such as Render for backend and Vercel for frontend."), heading("Research Questions", 2)]
    add_bullets(body, ["How can a college complaint process be digitized while keeping it easy for students to use?", "How can role-based access be enforced securely across frontend and backend?", "How can complaints be routed automatically to the correct department?", "How can administrators use analytics to improve campus issue resolution?"])
    body.append(p("", page_break=True))

    body += [heading("CHAPTER 2: LITERATURE REVIEW"), heading("Existing Complaint Handling Practices", 2), p("Complaint systems in many institutions use registers, email, phone calls, or informal messaging. These approaches can work for small issue volumes but become difficult to manage when many students and departments are involved. Manual systems usually do not provide real-time status, analytics, or complete history."), heading("Web-Based Grievance Redressal Systems", 2), p("Web-based grievance systems centralize issue reporting and provide structured data fields such as category, description, status, and assigned authority. They improve traceability and reduce communication gaps. However, many simple systems lack modern UI, image evidence, role-specific dashboards, and analytics."), heading("MERN Stack Applications", 2), p("The MERN stack is commonly used for modern full-stack applications. React supports responsive component-based interfaces, Express and Node.js provide REST API services, and MongoDB offers flexible document storage suitable for complaint records, users, comments, and media paths."), heading("Comparative Table", 2), table([["Feature", "Manual Register", "Email / Messaging", "Basic Web Form", "Campus Resolve"], ["Role-based dashboards", "No", "No", "Limited", "Yes"], ["Complaint status tracking", "Manual", "Partial", "Partial", "Yes"], ["Image evidence", "No", "Possible but scattered", "Limited", "Yes"], ["Automatic category routing", "No", "No", "No", "Yes"], ["Admin analytics", "No", "No", "Limited", "Yes"], ["Student-staff discussion history", "No", "Scattered", "Limited", "Yes"]]), p("Table 1. Comparison of existing complaint handling systems"), heading("Identified Gaps", 2)]
    add_bullets(body, ["Lack of transparent status tracking for students.", "No single dashboard for administrators to monitor issue volume and resolution progress.", "No automatic department routing in manual or basic systems.", "Limited support for evidence attachments and discussion history.", "Weak accountability when complaints are communicated informally."])
    body.append(p("", page_break=True))

    body += [heading("CHAPTER 3: SYSTEM ANALYSIS & REQUIREMENTS"), heading("Proposed System", 2), p("Campus Resolve is proposed as a secure, role-based complaint management platform. A student can submit a complaint with title, description, category, location, optional anonymous identity, and image evidence. The backend stores the complaint and assigns it to a suitable role based on category. Staff members process the complaint, communicate through comments, and update the status. Administrators oversee all users, complaints, priorities, assignments, and analytics."), heading("Functional Requirements", 2)]
    add_bullets(body, ["User registration and login using JWT authentication.", "Student dashboard for complaint submission, history, notifications, and settings.", "Image upload with validation and storage through Multer.", "Complaint category selection and automatic role assignment.", "Staff dashboard for assigned complaint management.", "Admin dashboard for analytics, complaint assignment, user management, and staff account creation.", "Comment system with public messages and internal notes.", "Status lifecycle: Pending, In Progress, Resolved, and Rejected."])
    body += [heading("Non-Functional Requirements", 2)]
    add_bullets(body, ["Security: hashed passwords, JWT verification, HTTP-only cookie support, and role-based authorization.", "Usability: responsive dashboards with search, filters, cards, charts, and modals.", "Reliability: database-backed persistence for users, complaints, comments, and image paths.", "Maintainability: modular routes, controllers, models, middleware, stores, and pages.", "Scalability: document database structure and REST APIs suitable for future modules."])
    body += [heading("Software Requirements", 2), table([["Layer", "Technology Used"], ["Frontend", "React.js, Vite, Tailwind CSS, Zustand, Axios, React Router, Recharts, Lucide React, Framer Motion"], ["Backend", "Node.js, Express.js, Mongoose, JWT, bcryptjs, cookie-parser, CORS, Morgan, Multer"], ["Database", "MongoDB"], ["Deployment Support", "Vercel configuration for frontend, Render configuration for backend"], ["Development Tools", "Node.js 20+, npm, VS Code, Git"]]), p("Table 2. Software and technology requirements"), heading("Constraints", 2)]
    add_bullets(body, ["The backend depends on a valid MongoDB connection string in environment variables.", "Images are stored in the backend uploads folder; cloud storage can be added in future.", "The current project uses request-response APIs rather than WebSocket-based real-time messaging.", "Screenshots should be captured from the running project for final submission because dashboard data depends on live users and complaints."])
    body.append(p("", page_break=True))

    body += [heading("CHAPTER 4: SYSTEM ARCHITECTURE & DESIGN"), heading("System Architecture", 2), p("The architecture follows a client-server pattern. The React frontend communicates with the Express backend through Axios. The backend exposes REST APIs for authentication, complaint management, and image uploads. Mongoose models map data to MongoDB collections. JWT-based middleware protects private routes and role-based authorization controls access to admin, staff, and student operations."), image(arch, "Figure 1. Campus Resolve System Architecture"), heading("Database Design", 2), table([["Collection", "Main Fields", "Purpose"], ["Users", "name, email, password, phoneNumber, role, department, rollNumber, year, residence, staffId, isActive", "Stores student, staff, and admin accounts"], ["Complaints", "student, title, description, category, location, gpsCoordinates, priority, status, images, isAnonymous, assignedTo, remarks, unread flags", "Stores complaint records and lifecycle information"], ["Comments", "complaint, user, text, isInternal, images, timestamps", "Stores discussion timeline and internal notes"]]), p("Table 3. Database collections and purpose"), heading("Complaint Resolution Flowchart", 2), image(flow, "Figure 2. Complaint Resolution Flowchart"), heading("Activity Diagrams", 2), image(student_act, "Figure 3. Student Complaint Activity Diagram"), image(staff_act, "Figure 4. Admin and Staff Activity Diagram"), heading("Data Flow Diagram", 2), image(dfd, "Figure 5. Level-0 Data Flow Diagram"), p("", page_break=True)]

    body += [heading("CHAPTER 5: IMPLEMENTATION & METHODOLOGY"), heading("Frontend Implementation", 2), p("The frontend is implemented in React using Vite. Pages include Home, Login, Register, Student Dashboard, Staff Dashboard, and Admin Dashboard. Zustand stores manage authentication and complaint state. Axios is configured with a base API URL and automatically attaches the locally stored JWT token to requests. Tailwind CSS and Lucide React are used to create a responsive and icon-based interface."), heading("Backend Implementation", 2), p("The backend is implemented using Express.js. The server configures JSON parsing, URL encoding, cookies, CORS, static upload serving, and centralized error handling. It mounts auth routes under /api/auth, complaint routes under /api/complaints, and upload routes under /api/upload. MongoDB connection is initialized before the server begins listening."), heading("Authentication and Authorization", 2), p("Users register and log in using email and password. Passwords are hashed with bcrypt before saving. On login, the backend creates a JWT token valid for 30 days and sends it in an HTTP-only cookie while also returning the token for frontend storage. The protect middleware verifies the cookie or Bearer token and loads the user record. The authorize middleware restricts APIs by role."), heading("Complaint Management Logic", 2), p("When a complaint is created, the backend checks the category and assigns a default responsible role. Hostel complaints are routed to wardens, Academics to faculty, Library to librarians, Canteen to canteen managers, and Others to general staff. Students see only their own complaints, while staff roles see category-specific complaints. Admins can view all complaints and apply filters."), heading("API Route Summary", 2), table([["Module", "Method and Route", "Access", "Purpose"], ["Auth", "POST /api/auth/register", "Public", "Register user"], ["Auth", "POST /api/auth/login", "Public", "Authenticate user"], ["Auth", "GET /api/auth/me", "Private", "Fetch profile"], ["Auth", "POST /api/auth/staff", "Admin", "Create staff account"], ["Auth", "GET /api/auth/users", "Admin", "List users"], ["Complaints", "POST /api/complaints", "Student/Admin", "Create complaint"], ["Complaints", "GET /api/complaints", "Private", "Fetch role-filtered complaints"], ["Complaints", "PUT /api/complaints/:id/status", "Staff/Admin", "Update status and remarks"], ["Complaints", "PUT /api/complaints/:id/assign", "Admin", "Assign staff"], ["Complaints", "POST /api/complaints/:id/comments", "Private", "Add comment"], ["Upload", "POST /api/upload", "Public route in backend", "Upload up to 5 images"]]), p("Table 4. API route summary"), heading("Image Upload Implementation", 2), p("The upload module uses Multer disk storage. It allows jpeg, jpg, png, and webp files with a maximum size of 5 MB per file and supports up to 5 images per request. Uploaded files are stored in the backend uploads directory and served statically using the /uploads path."), heading("Implementation Screenshots", 2)]
    if screens:
        body.append(image(screens[0], "Figure 6. Available project UI asset / dashboard preview", 5.8))
    body += [p("For final college submission, add actual browser screenshots captured from the running application. Recommended screenshots: Home page, Login page, Student dashboard, Submit complaint modal, Complaint details/chat modal, Staff dashboard, Admin analytics dashboard, Staff management screen, and Uploaded evidence preview."), p("", page_break=True)]

    body += [heading("CHAPTER 6: RESULTS & DISCUSSION"), heading("Testing Approach", 2), p("The project was examined from functional and workflow perspectives. Core flows include registration, login, role-based redirection, complaint creation, image upload, automatic assignment, status update, comment addition, notification flags, and admin user management."), heading("System Testing Results", 2), table([["Test Case", "Expected Result", "Observed Result"], ["Student registration", "Student account created and logged in", "Implemented through /api/auth/register"], ["Login with valid credentials", "JWT generated and user redirected by role", "Implemented through /api/auth/login and frontend routing"], ["Complaint submission", "Complaint stored with category, location, images, and student reference", "Implemented in createComplaint controller"], ["Automatic routing", "Complaint assigned to suitable staff role", "Implemented by category-to-role logic"], ["Staff status update", "Status and remarks updated", "Implemented through /:id/status route"], ["Comment timeline", "Messages stored and shown in order", "Implemented using Comment model and comments routes"], ["Admin user management", "Admin can list, create, deactivate, and delete users", "Implemented in auth controller and Admin dashboard"], ["Image upload", "Valid images saved and paths returned", "Implemented using Multer upload route"]]), p("Table 5. System testing results"), heading("Discussion", 2), p("Campus Resolve successfully demonstrates a practical complaint redressal workflow. The system separates responsibilities between students, staff, and administrators. The use of role-based filtering reduces confusion, while admin analytics help identify issue categories and resolution status. The comment module improves communication and creates a record of actions taken."), p("The current version is suitable as a mini-project because it includes frontend, backend, database, authentication, authorization, file upload, dashboard analytics, and deployment configuration. Future versions can add real-time notifications, email alerts, cloud file storage, and formal escalation rules."), p("", page_break=True)]

    body += [heading("CHAPTER 7: ADVANTAGES, LIMITATIONS & APPLICATIONS"), heading("Advantages", 2)]
    add_bullets(body, ["Centralized platform for all campus complaints.", "Transparent complaint status tracking for students.", "Role-based dashboards for students, staff, and administrators.", "Automatic department routing based on complaint category.", "Image evidence upload improves clarity and verification.", "Admin analytics support better decision making.", "Secure authentication and password hashing.", "Responsive modern user interface."])
    body += [heading("Limitations", 2)]
    add_bullets(body, ["The system currently stores uploaded files locally instead of a cloud object storage service.", "Real-time communication uses refresh/API calls, not WebSocket push updates.", "Email/SMS notifications are not currently implemented.", "Some institution-specific fields such as guide name and final department authority must be filled before submission.", "Production deployment requires careful environment variable configuration and secure JWT secret management."])
    body += [heading("Applications", 2)]
    add_bullets(body, ["College grievance redressal and student service desks.", "Hostel maintenance complaint tracking.", "Library, canteen, and academic issue handling.", "Internal campus facility management.", "Administrative reporting and issue trend analysis."])
    body.append(p("", page_break=True))

    body += [heading("CHAPTER 8: FUTURE SCOPE")]
    add_bullets(body, ["Add WebSocket-based real-time notifications and live chat.", "Integrate email, SMS, or WhatsApp alerts for status changes.", "Use cloud storage such as AWS S3 or Cloudinary for uploaded evidence.", "Add escalation rules when complaints remain pending beyond a deadline.", "Add student feedback and rating analytics after resolution.", "Introduce department-wise SLA reports for administrators.", "Add mobile app support for easier complaint submission from phones.", "Use AI-based classification to suggest category and priority from complaint text."])
    body.append(p("", page_break=True))

    body += [heading("CHAPTER 9: CONCLUSION"), p("Campus Resolve provides a complete digital solution for campus complaint management. It allows students to report issues with evidence, enables staff to process and resolve assigned complaints, and gives administrators a complete overview of users, departments, priorities, and complaint trends. The project applies important software engineering concepts such as modular architecture, REST API design, database modeling, authentication, authorization, file handling, state management, and responsive frontend development."), p("The system improves transparency, accountability, and communication in campus issue resolution. With future enhancements such as real-time alerts, cloud storage, and automated escalation, Campus Resolve can be expanded into a production-ready institutional grievance redressal system.", page_break=True)]
    body += [heading("CHAPTER 10: REFERENCES")]
    add_bullets(body, ["MongoDB Documentation, Mongoose ODM Guide.", "Express.js Official Documentation.", "React.js Official Documentation.", "Vite Official Documentation.", "JSON Web Token (JWT) Introduction and Best Practices.", "Multer Documentation for Multipart File Uploads.", "Tailwind CSS Documentation.", "Recharts Documentation for Data Visualization.", "Node.js Official Documentation.", "Campus Resolve project source code files: backend routes, controllers, models, middleware, and frontend pages/stores."])


def make_docx():
    body = build_body()
    sect_pr = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
    document = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" mc:Ignorable=""><w:body>' + "".join(body) + sect_pr + "</w:body></w:document>"
    styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr></w:style></w:styles>'
    numbering = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'
    content_types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>'
    root_rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
    doc_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rStyle" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>']
    for rid, _, dest in rels:
        doc_rels.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{dest}"/>')
    doc_rels.append("</Relationships>")
    if OUT.exists():
        OUT.unlink()
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", root_rels)
        z.writestr("word/document.xml", document)
        z.writestr("word/styles.xml", styles)
        z.writestr("word/numbering.xml", numbering)
        z.writestr("word/_rels/document.xml.rels", "".join(doc_rels))
        for _, path, dest in rels:
            z.write(path, "word/" + dest)
    print(OUT)
    print(f"Images embedded: {len(rels)}")


if __name__ == "__main__":
    make_docx()

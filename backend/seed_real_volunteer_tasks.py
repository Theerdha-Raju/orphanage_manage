import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Volunteer, VolunteerAssignment, Login, Users

def seed_tasks():
    print("=" * 70)
    print("SEEDING DISTINCT ASSIGNED ACTIVITIES FOR ALL VOLUNTEERS")
    print("=" * 70)

    # 1. Define canonical volunteers with their credentials and specializations
    volunteer_definitions = [
        {
            "full_name": "Rahul Singh",
            "primary_email": "volunteer@orphanage.com",
            "aliases": ["rahul.singh@orphanage.com", "rahul.singh@volunteer.orphanage.com", "rahul.singh@gmail.com"],
            "password": "Volunteer@123",
            "phone_number": "+91 97112 23344",
            "address": "Room 12, Volunteer Quarters, Orphanage Campus",
            "skills": "Mathematics Tutoring, STEM Mentorship, Robotics & Python Basics, Chess Strategy",
            "areas_of_interest": "Education, Computer Learning, Extracurricular",
            "availability": "Weekends & Evenings",
            "status": "Active",
            "gender": "Male",
            "designation": "Lead Volunteer Coordinator"
        },
        {
            "full_name": "Anita Desai",
            "primary_email": "anita.desai@yahoo.com",
            "aliases": ["anita.desai@volunteer.orphanage.com"],
            "password": "Vol@123",
            "phone_number": "+91 97223 34455",
            "address": "Block 4, Staff & Mentor Apartments, Campus North",
            "skills": "Creative Story Writing, Public Speaking, English Literature, Drama & Theatre",
            "areas_of_interest": "Education, Literature, Youth Mentorship, Theatre",
            "availability": "Weekdays & Saturdays",
            "status": "Active",
            "gender": "Female",
            "designation": "Community Youth Mentor"
        },
        {
            "full_name": "Vikram Patel",
            "primary_email": "vikram.patel@outlook.com",
            "aliases": [],
            "password": "Vikram@Vol123",
            "phone_number": "+91 97334 45566",
            "address": "14 MG Road, Civil Lines, City Center",
            "skills": "World Geography, Ancient History, Science Quiz Coaching, Social Sciences",
            "areas_of_interest": "Education, History, Heritage Studies, Astronomy",
            "availability": "Weekends",
            "status": "Active",
            "gender": "Male",
            "designation": "Weekend Academic Tutor"
        },
        {
            "full_name": "Priya Verma",
            "primary_email": "priya.verma@gmail.com",
            "aliases": ["priya.verma@volunteer.orphanage.com", "priya.verma1@gmail.com"],
            "password": "Vol@123",
            "phone_number": "+91 97445 56677",
            "address": "Rose Villa, Sunrise Nagar, Near City Library",
            "skills": "Clay Modeling & Sculpture, Classical Kathak & Folk Dance, Watercolor Painting, Handicrafts",
            "areas_of_interest": "Arts and Crafts, Cultural Events, Fine Arts, Dance",
            "availability": "Tuesdays, Thursdays & Weekends",
            "status": "Active",
            "gender": "Female",
            "designation": "Arts & Activities Specialist"
        },
        {
            "full_name": "Siddharth Roy",
            "primary_email": "siddharth.roy@gmail.com",
            "aliases": [],
            "password": "Siddharth@Vol123",
            "phone_number": "+91 97556 67788",
            "address": "Sports Complex Annex, Orphanage Campus",
            "skills": "Football Academy Drills, Track & Field Athletics, Cricket Coaching, Yoga & Self-Defense",
            "areas_of_interest": "Sports, Physical Education, Fitness & Wellness",
            "availability": "Mornings & Weekends",
            "status": "Active",
            "gender": "Male",
            "designation": "Sports & Fitness Coach"
        },
        {
            "full_name": "Deepa S",
            "primary_email": "deepa.s@orphanage.com",
            "aliases": ["deepa6@gmail.com", "deepa1@orphanage.com", "deepa2@gmail.com"],
            "password": "Deepa@Vol123",
            "phone_number": "+91 98467 06840",
            "address": "Wing B, Health & Wellness Center, Orphanage Campus",
            "skills": "Pediatric Dental Care & Hygiene, First Aid & CPR, Healthy Cooking, Mindfulness",
            "areas_of_interest": "Health & Hygiene, Nutrition, Life Skills, Gardening",
            "availability": "Weekdays & Mornings",
            "status": "Active",
            "gender": "Female",
            "designation": "Field Volunteer & Health Mentor"
        },
        {
            "full_name": "Priya Nair",
            "primary_email": "priya.nair8@orphanage.com",
            "aliases": [],
            "password": "Priya@123",
            "phone_number": "+91 79079 23497",
            "address": "Apt 2B, Green Meadows, West Layout",
            "skills": "Classical Indian Vocals, Cognitive Strategy Board Games, Junior Financial Literacy, Puppetry",
            "areas_of_interest": "Music, Cognitive Development, Life Skills, Creative Arts",
            "availability": "Flexible",
            "status": "Active",
            "gender": "Female",
            "designation": "Creative Performing Arts Mentor"
        },
        {
            "full_name": "Anitha",
            "primary_email": "anithaVolunteer@gmail.com",
            "aliases": [],
            "password": "Vol@123",
            "phone_number": "+91 98467 89216",
            "address": "Sunrise Colony, Near Orphanage Campus East",
            "skills": "Early Childhood Phonics, Sensory Play Discovery, Motor Skills Development, Storytelling",
            "areas_of_interest": "Early Childhood Education, Sensory Development, Child Care",
            "availability": "Weekdays",
            "status": "Active",
            "gender": "Female",
            "designation": "Early Learning Volunteer"
        }
    ]

    # Clean existing volunteer assignments and volunteer records before reorganizing
    VolunteerAssignment.objects.all().delete()
    Volunteer.objects.all().delete()

    canonical_vols = {}

    for vdef in volunteer_definitions:
        all_emails = [vdef["primary_email"]] + vdef["aliases"]

        vol = Volunteer.objects.create(
            full_name=vdef["full_name"],
            email=vdef["primary_email"],
            phone_number=vdef["phone_number"],
            address=vdef["address"],
            skills=vdef["skills"],
            areas_of_interest=vdef["areas_of_interest"],
            availability=vdef["availability"],
            status=vdef["status"]
        )

        canonical_vols[vdef["full_name"]] = vol

        # Ensure associated User
        usr = Users.objects.filter(full_name__iexact=vdef["full_name"]).first()
        if not usr:
            usr = Users.objects.create(
                full_name=vdef["full_name"],
                phone_number=vdef["phone_number"],
                gender=vdef["gender"],
                address=vdef["address"],
                designation=vdef["designation"],
                status='Active'
            )
        else:
            usr.full_name = vdef["full_name"]
            usr.designation = vdef["designation"]
            usr.save()

        # Ensure Logins for primary email and all aliases
        for em in all_emails:
            login_obj = Login.objects.filter(email__iexact=em).first()
            if not login_obj:
                Login.objects.create(
                    email=em,
                    password=vdef["password"],
                    role='volunteer',
                    status='Active',
                    user=usr
                )
            else:
                login_obj.password = vdef["password"]
                login_obj.role = 'volunteer'
                login_obj.user = usr
                login_obj.save()

        print(f"Volunteer Ready: #{vol.volunteer_id} {vol.full_name} ({vol.email})")

    # 2. SEED 48 COMPLETELY DISTINCT ACTIVITIES (6 PER VOLUNTEER)
    # Every volunteer gets their own different, domain-specific assigned activities!
    distinct_activities = [
        # =========================================================================
        # 1. RAHUL SINGH (Lead Tech & Mathematics Coordinator)
        # =========================================================================
        {
            "volunteer_name": "Rahul Singh",
            "event_name": "Advanced Mathematics & Algebra Masterclass",
            "description": "Work through quadratic equations, algebraic polynomials, and factoring with Class 8-10 students.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-20",
            "scheduled_date": "2026-10-05",
            "due_date": "2026-10-05",
            "assigned_children": "5 Children (Class 8-10)",
            "location": "Education Center - Room 3",
            "assigned_by": "Academic Director",
            "instructions": "Walk through quadratic equations on whiteboard. Provide individual problem sets and guide step-by-step factoring.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Rahul Singh",
            "event_name": "Scratch Animation & Block Coding Lab",
            "description": "Interactive coding session where children build animated sprite games and sound loops using Scratch 3.0.",
            "activity_type": "Computer Learning",
            "priority": "High",
            "assigned_date": "2026-09-18",
            "scheduled_date": "2026-09-29",
            "due_date": "2026-09-29",
            "assigned_children": "8 Children (Junior Tech)",
            "location": "Computer Lab - Block A",
            "assigned_by": "IT Coordinator",
            "instructions": "Guide students to create moving characters, keyboard controls, and interactive collision sound effects.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Students created basic jumping mechanics for their sprite characters. Designing level 2 now."
        },
        {
            "volunteer_name": "Rahul Singh",
            "event_name": "Robotics & DIY Sensor Circuit Workshop",
            "description": "Hands-on electronics workshop assembling light-sensing automatic night lights with breadboards and LEDs.",
            "activity_type": "Extracurricular",
            "priority": "Medium",
            "assigned_date": "2026-09-22",
            "scheduled_date": "2026-10-12",
            "due_date": "2026-10-12",
            "assigned_children": "6 Children (STEM Club)",
            "location": "Science & Innovation Lab",
            "assigned_by": "Academic Director",
            "instructions": "Supervise 9V battery connections and LDR sensor circuits. Ensure safety glasses are worn at all times.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Rahul Singh",
            "event_name": "Speed Vedic Mathematics & Mental Arithmetic",
            "description": "Remedial fast calculation drills teaching cross-multiplication shortcuts and mental square root tricks.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-15",
            "scheduled_date": "2026-09-24",
            "due_date": "2026-09-24",
            "assigned_children": "7 Children (Class 6)",
            "location": "Education Center - Room 2",
            "assigned_by": "Head Teacher",
            "instructions": "Teach mental multiplication by 11, 25, and 99. End with a 15-minute speed arithmetic competition.",
            "status": "Completed",
            "completion_date": "2026-09-24",
            "remarks": "All 7 children demonstrated 40% faster calculation in the end-of-session quiz. Great enthusiasm."
        },
        {
            "volunteer_name": "Rahul Singh",
            "event_name": "Python Fundamentals: Loops & Text Adventures",
            "description": "Introduction to Python programming syntax, while loops, if-else logic, and text-based interactive story games.",
            "activity_type": "Computer Learning",
            "priority": "High",
            "assigned_date": "2026-09-24",
            "scheduled_date": "2026-10-08",
            "due_date": "2026-10-08",
            "assigned_children": "6 Children (Senior Tech)",
            "location": "Computer Lab - Block A",
            "assigned_by": "IT Coordinator",
            "instructions": "Provide individual terminal access. Teach variable assignment and input() function through a maze game.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Rahul Singh",
            "event_name": "Competitive Chess Strategy & Endgames",
            "description": "Structured chess tournament and positional strategy training focusing on King-Pawn and Rook endgames.",
            "activity_type": "Extracurricular",
            "priority": "Low",
            "assigned_date": "2026-09-19",
            "scheduled_date": "2026-09-30",
            "due_date": "2026-09-30",
            "assigned_children": "10 Children",
            "location": "Library Quiet Corner",
            "assigned_by": "Care Coordinator",
            "instructions": "Review opening principles for first 15 mins. Organize a 5-round swiss chess tournament with chess clocks.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Round 2 completed. 4 children advanced to the semi-final bracket."
        },

        # =========================================================================
        # 2. ANITA DESAI (Community Youth Mentor & Literature Lead)
        # =========================================================================
        {
            "volunteer_name": "Anita Desai",
            "event_name": "Creative Story Writing & Character Design",
            "description": "Writing workshop encouraging children to draft 3-act narrative story arcs with original illustrated heroes.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-18",
            "scheduled_date": "2026-09-28",
            "due_date": "2026-09-28",
            "assigned_children": "6 Children (Class 5-7)",
            "location": "Reading Room A",
            "assigned_by": "Education Lead",
            "instructions": "Distribute ruled creative journals. Guide story brainstorming with prompt cards and sensory descriptions.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Protagonist sketches completed; students are drafting the narrative climax scene."
        },
        {
            "volunteer_name": "Anita Desai",
            "event_name": "Children's Theatre & Street Play Rehearsal",
            "description": "Dramatic rehearsal of an educational street play on environmental conservation and protecting nature.",
            "activity_type": "Extracurricular",
            "priority": "High",
            "assigned_date": "2026-09-25",
            "scheduled_date": "2026-10-14",
            "due_date": "2026-10-14",
            "assigned_children": "12 Children (Cultural Wing)",
            "location": "Activity Hall A",
            "assigned_by": "Cultural Secretary",
            "instructions": "Rehearse opening dialogue and synchronized slogans. Focus on confident voice projection without microphones.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Anita Desai",
            "event_name": "Public Speaking & Debate Fundamentals",
            "description": "Interactive communication session teaching parliamentary debate etiquette, speech structure, and rebuttals.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-21",
            "scheduled_date": "2026-10-06",
            "due_date": "2026-10-06",
            "assigned_children": "8 Children (Senior Wing)",
            "location": "Audio-Visual Seminar Room",
            "assigned_by": "Education Lead",
            "instructions": "Conduct 2-minute impromptu speeches on topics like 'Teamwork in Sports' and 'My Favourite Hero'.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Anita Desai",
            "event_name": "English Phonetics & Poetry Recitation",
            "description": "Elocution workshop focusing on vowel sounds, rhythm, cadence, and expressive delivery of famous poems.",
            "activity_type": "Education",
            "priority": "Low",
            "assigned_date": "2026-09-12",
            "scheduled_date": "2026-09-22",
            "due_date": "2026-09-22",
            "assigned_children": "7 Children (Junior Wing)",
            "location": "Library Hall",
            "assigned_by": "Head Teacher",
            "instructions": "Practice reciting Robert Frost and Sarojini Naidu verses with hand gestures and vocal modulation.",
            "status": "Completed",
            "completion_date": "2026-09-22",
            "remarks": "Each child recited their chosen poem in front of the group with great confidence and clear diction."
        },
        {
            "volunteer_name": "Anita Desai",
            "event_name": "Career Aspirations & Youth Mentorship Circle",
            "description": "Personal development circle mapping adolescent goals, education pathways, and vocational interests.",
            "activity_type": "Extracurricular",
            "priority": "Medium",
            "assigned_date": "2026-09-23",
            "scheduled_date": "2026-10-02",
            "due_date": "2026-10-02",
            "assigned_children": "9 Teenagers (Grade 9-10)",
            "location": "Conference Room B",
            "assigned_by": "Superintendent",
            "instructions": "Facilitate one-on-one goal setting, resume awareness, and vocational pathway mapping.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Identified career interests: 3 engineering, 2 healthcare, 2 graphic arts, 2 hospitality."
        },
        {
            "volunteer_name": "Anita Desai",
            "event_name": "Weekly Newspaper Review & Current Affairs",
            "description": "Reading youth newspapers, discussing global geography events, and publishing a student bulletin board.",
            "activity_type": "Education",
            "priority": "Low",
            "assigned_date": "2026-09-26",
            "scheduled_date": "2026-10-11",
            "due_date": "2026-10-11",
            "assigned_children": "8 Children",
            "location": "Reading Room B",
            "assigned_by": "Education Lead",
            "instructions": "Pick positive world news stories, discuss geography connections, and update the campus noticeboard.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },

        # =========================================================================
        # 3. VIKRAM PATEL (Weekend Academic Tutor & Heritage Studies)
        # =========================================================================
        {
            "volunteer_name": "Vikram Patel",
            "event_name": "Interactive World Geography & Map Quest",
            "description": "Hands-on cartography exploration locating tectonic plates, mountain chains, and world capitals on giant globes.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-22",
            "scheduled_date": "2026-10-07",
            "due_date": "2026-10-07",
            "assigned_children": "8 Children (Grade 6-7)",
            "location": "Education Center - Room 4",
            "assigned_by": "Academic Coordinator",
            "instructions": "Use globe models and blank outline maps to identify continents, ocean currents, and mountain ranges.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Vikram Patel",
            "event_name": "Ancient Indian History & Heritage Monuments",
            "description": "Virtual 3D exploration of Indus Valley architecture, Ashokan pillars, and ancient temple geometry.",
            "activity_type": "Education",
            "priority": "Low",
            "assigned_date": "2026-09-17",
            "scheduled_date": "2026-09-27",
            "due_date": "2026-09-27",
            "assigned_children": "11 Children",
            "location": "Audio-Visual Hall",
            "assigned_by": "Social Studies Mentor",
            "instructions": "Show virtual walkthroughs of Mohenjo-Daro and Ellora Caves. Children build model terracotta brick houses.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Indus Valley presentation complete. Children built Harappan brick models with clay."
        },
        {
            "volunteer_name": "Vikram Patel",
            "event_name": "Inter-Wing General Knowledge & Science Bowl",
            "description": "Multi-round quiz competition with buzzer rounds, audio identification, and current science puzzles.",
            "activity_type": "Extracurricular",
            "priority": "High",
            "assigned_date": "2026-09-27",
            "scheduled_date": "2026-10-16",
            "due_date": "2026-10-16",
            "assigned_children": "16 Children (4 Teams)",
            "location": "Main Auditorium",
            "assigned_by": "Academic Coordinator",
            "instructions": "Host rapid-fire buzzer round, audio clues round, and science puzzle round with prize certificates.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Vikram Patel",
            "event_name": "Stargazing & Planetary Astronomy Night",
            "description": "Telescope observation session tracking moon craters, Saturn's rings, and identifying northern constellations.",
            "activity_type": "Extracurricular",
            "priority": "High",
            "assigned_date": "2026-09-14",
            "scheduled_date": "2026-09-21",
            "due_date": "2026-09-21",
            "assigned_children": "12 Children",
            "location": "Campus Terrace Observatory",
            "assigned_by": "Science Department",
            "instructions": "Set up the refractor telescope to view lunar craters, Jupiter's moons, and the Andromeda galaxy.",
            "status": "Completed",
            "completion_date": "2026-09-21",
            "remarks": "Clear skies enabled viewing Jupiter's 4 Galilean moons. Children sketched moon craters in notebooks."
        },
        {
            "volunteer_name": "Vikram Patel",
            "event_name": "Freshwater Ecology & River Basin Study",
            "description": "Study of river ecosystems, water filtration sand columns, and conservation of freshwater resources.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-24",
            "scheduled_date": "2026-10-09",
            "due_date": "2026-10-09",
            "assigned_children": "7 Children",
            "location": "Science Lab 2",
            "assigned_by": "Academic Coordinator",
            "instructions": "Study the water cycle, water table filtration using sand columns, and river conservation.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Vikram Patel",
            "event_name": "Social Sciences Remedial Exam Preparation",
            "description": "Focused tutoring on civics, the Indian Constitution, democratic institutions, and mock board papers.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-20",
            "scheduled_date": "2026-10-01",
            "due_date": "2026-10-01",
            "assigned_children": "6 Children (Board Exam Prep)",
            "location": "Study Hall 2",
            "assigned_by": "Head Teacher",
            "instructions": "Review civics chapters on the Constitution, fundamental rights, and solve mock question papers.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Completed revision of Chapters 1-3. Administered a 25-mark practice test."
        },

        # =========================================================================
        # 4. PRIYA VERMA (Arts, Crafts & Performing Arts Specialist)
        # =========================================================================
        {
            "volunteer_name": "Priya Verma",
            "event_name": "Colorful Clay Modeling & Animal Figurines",
            "description": "Sensory sculpting workshop teaching fine motor coordination and 3D miniature animal shaping with clay.",
            "activity_type": "Arts and Crafts",
            "priority": "Low",
            "assigned_date": "2026-09-21",
            "scheduled_date": "2026-10-04",
            "due_date": "2026-10-04",
            "assigned_children": "8 Children (Primary Group)",
            "location": "Art & Sculpture Studio",
            "assigned_by": "Care Coordinator",
            "instructions": "Demonstrate rolling, pinching, and coiling non-toxic polymer clay to shape wildlife animals.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Priya Verma",
            "event_name": "Classical Kathak & Folk Dance Choreography",
            "description": "Rhythmic dance rehearsal focusing on tatkar footwork, mudra hand expressions, and team stage formations.",
            "activity_type": "Arts and Crafts",
            "priority": "High",
            "assigned_date": "2026-09-25",
            "scheduled_date": "2026-10-10",
            "due_date": "2026-10-10",
            "assigned_children": "14 Children (Dance Troupe)",
            "location": "Auditorium Main Stage",
            "assigned_by": "Cultural Coordinator",
            "instructions": "Teach footwork (tatkar), hand gestures (mudras), and team synchronization for annual day performance.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Troupes have memorized the opening rhythmic sequence and first transition."
        },
        {
            "volunteer_name": "Priya Verma",
            "event_name": "Watercolor Painting: Sunsets & Nature Landscapes",
            "description": "Technique studio on wet-on-wet watercolor washes, color mixing, horizon blending, and silhouette trees.",
            "activity_type": "Arts and Crafts",
            "priority": "Medium",
            "assigned_date": "2026-09-26",
            "scheduled_date": "2026-10-13",
            "due_date": "2026-10-13",
            "assigned_children": "9 Children",
            "location": "Art Studio - Terrace Wing",
            "assigned_by": "Fine Arts Lead",
            "instructions": "Demonstrate wet-on-wet watercolor washes, color blending, and silhouette trees on cartridge paper.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Priya Verma",
            "event_name": "Japanese Origami & Festive Paper Lanterns",
            "description": "Geometric paper folding creating hanging lotus lanterns, paper cranes, and modular decorative stars.",
            "activity_type": "Arts and Crafts",
            "priority": "Low",
            "assigned_date": "2026-09-16",
            "scheduled_date": "2026-09-23",
            "due_date": "2026-09-23",
            "assigned_children": "10 Children",
            "location": "Activity Hall B",
            "assigned_by": "Care Coordinator",
            "instructions": "Fold origami cranes, lotus flowers, and colorful hanging lanterns for the upcoming festive decor.",
            "status": "Completed",
            "completion_date": "2026-09-23",
            "remarks": "Over 40 origami crafts created; hung up across the orphanage dining hall ceiling."
        },
        {
            "volunteer_name": "Priya Verma",
            "event_name": "Terracotta Pottery & Traditional Vase Painting",
            "description": "Shaping raw earthenware pottery on manual turntables, sun drying, and painting Warli folk patterns.",
            "activity_type": "Arts and Crafts",
            "priority": "Medium",
            "assigned_date": "2026-09-27",
            "scheduled_date": "2026-10-17",
            "due_date": "2026-10-17",
            "assigned_children": "7 Children",
            "location": "Open Pottery Shed",
            "assigned_by": "Cultural Coordinator",
            "instructions": "Use manual pottery turntable to shape terracotta clay bowls, bake in oven, and paint acrylic motifs.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Priya Verma",
            "event_name": "Handmade Greeting Cards & Calligraphy Lab",
            "description": "Crafting handcrafted thank-you greeting cards with calligraphy lettering and pressed flower borders.",
            "activity_type": "Arts and Crafts",
            "priority": "Medium",
            "assigned_date": "2026-09-20",
            "scheduled_date": "2026-09-29",
            "due_date": "2026-09-29",
            "assigned_children": "11 Children",
            "location": "Craft Corner - Wing C",
            "assigned_by": "Care Coordinator",
            "instructions": "Teach broad-tip calligraphy pen strokes and design personalized gratitude cards for donors.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "15 cards crafted and lettered beautifully with thank-you messages."
        },

        # =========================================================================
        # 5. SIDDHARTH ROY (Sports & Fitness Coach)
        # =========================================================================
        {
            "volunteer_name": "Siddharth Roy",
            "event_name": "Junior Football Academy: Ball Control & Passing",
            "description": "Coaching ball mastery drills, one-touch passing, tactical spatial awareness, and a 25-minute practice scrimmage.",
            "activity_type": "Sports",
            "priority": "High",
            "assigned_date": "2026-09-19",
            "scheduled_date": "2026-09-28",
            "due_date": "2026-09-28",
            "assigned_children": "14 Children",
            "location": "Main Football Ground",
            "assigned_by": "Sports Director",
            "instructions": "Cone dribbling drills, two-touch passing, and a structured 25-minute practice match.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Great footwork improvement in defenders. Team captain selected for inter-school tournament."
        },
        {
            "volunteer_name": "Siddharth Roy",
            "event_name": "Cricket Coaching: Batting Stance & Bowling Drills",
            "description": "Net practice sessions focusing on front-foot defense, grip technique, and seam bowling accuracy.",
            "activity_type": "Sports",
            "priority": "Medium",
            "assigned_date": "2026-09-22",
            "scheduled_date": "2026-10-03",
            "due_date": "2026-10-03",
            "assigned_children": "12 Children",
            "location": "Campus Cricket Nets",
            "assigned_by": "Sports Director",
            "instructions": "Focus on forward defensive stroke, head position over the ball, and seam bowling grip.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Siddharth Roy",
            "event_name": "Athletic Sprint Drills & 4x100m Relay Handover",
            "description": "Sprint starting block acceleration, stride length training, and blind baton pass synchronization.",
            "activity_type": "Sports",
            "priority": "High",
            "assigned_date": "2026-09-17",
            "scheduled_date": "2026-09-25",
            "due_date": "2026-09-25",
            "assigned_children": "10 Children (Track Team)",
            "location": "400m Running Track",
            "assigned_by": "Physical Education Lead",
            "instructions": "Practice blind baton exchanges in the passing zone and explosive starting block acceleration.",
            "status": "Completed",
            "completion_date": "2026-09-25",
            "remarks": "All 3 relay pairs achieved clean baton handovers under 2.2 seconds without fumbles."
        },
        {
            "volunteer_name": "Siddharth Roy",
            "event_name": "Sunrise Yoga, Pranayama & Core Mobility",
            "description": "Early morning wellness session featuring Surya Namaskar series, deep breathing exercises, and core posture balance.",
            "activity_type": "Sports",
            "priority": "Low",
            "assigned_date": "2026-09-20",
            "scheduled_date": "2026-09-30",
            "due_date": "2026-09-30",
            "assigned_children": "16 Children",
            "location": "Open Garden Lawn",
            "assigned_by": "Wellness Director",
            "instructions": "Lead 12 rounds of Surya Namaskar, gentle spine twists, Anulom-Vilom, and 5 minutes savasana.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Morning routine adopted regularly; children report feeling calmer and more attentive in class."
        },
        {
            "volunteer_name": "Siddharth Roy",
            "event_name": "Table Tennis Spin Techniques & Singles League",
            "description": "Fast-paced indoor table tennis coaching focusing on backhand push, topspin loops, and intra-wing match play.",
            "activity_type": "Sports",
            "priority": "Medium",
            "assigned_date": "2026-09-26",
            "scheduled_date": "2026-10-11",
            "due_date": "2026-10-11",
            "assigned_children": "8 Children",
            "location": "Indoor Sports Room",
            "assigned_by": "Sports Director",
            "instructions": "Demonstrate topspin forehand drive, backhand push, and maintain tournament scoresheet.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Siddharth Roy",
            "event_name": "Self-Defense Basics & Agility Obstacle Course",
            "description": "Confidence-building self-defense tactics, balance recovery, breakaways, and footwork obstacle relays.",
            "activity_type": "Sports",
            "priority": "High",
            "assigned_date": "2026-09-27",
            "scheduled_date": "2026-10-15",
            "due_date": "2026-10-15",
            "assigned_children": "12 Children (Junior & Middle Wing)",
            "location": "Gymnasium Mat Area",
            "assigned_by": "Sports Director",
            "instructions": "Teach wrist breakaways, defensive shielding stance, balance recovery, and situational awareness.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },

        # =========================================================================
        # 6. DEEPA S (Health, Nutrition & Wellness Mentor)
        # =========================================================================
        {
            "volunteer_name": "Deepa S",
            "event_name": "Pediatric Dental Care & Hand Hygiene Drive",
            "description": "Interactive dental hygiene clinic demonstrating correct 2-minute brushing methods and distributing dental kits.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-20",
            "scheduled_date": "2026-09-29",
            "due_date": "2026-09-29",
            "assigned_children": "15 Children",
            "location": "Health Clinic - Wing B",
            "assigned_by": "Medical Officer",
            "instructions": "Demonstrate circular brushing technique on dental models. Distribute toothbrush and toothpaste kits.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Dental checkup completed for 10 children. 5 scheduled for fluoride varnish application."
        },
        {
            "volunteer_name": "Deepa S",
            "event_name": "First Aid & Emergency Preparedness Training",
            "description": "Practical emergency response drills covering sterile gauze bandaging, burn care, and recovery position.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-24",
            "scheduled_date": "2026-10-09",
            "due_date": "2026-10-09",
            "assigned_children": "10 Children (Senior Wardens)",
            "location": "First Aid Training Room",
            "assigned_by": "Campus Nurse",
            "instructions": "Hands-on training in wound antiseptic dressing, cold compresses for sprains, and fire emergency evacuation.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Deepa S",
            "event_name": "No-Flame Healthy Cooking: Nutrition & Fruit Salads",
            "description": "Culinary workshop teaching children food vitamin groups, raw sprout chaat preparation, and mindful eating.",
            "activity_type": "Extracurricular",
            "priority": "Medium",
            "assigned_date": "2026-09-12",
            "scheduled_date": "2026-09-20",
            "due_date": "2026-09-20",
            "assigned_children": "9 Children",
            "location": "Dining Hall Kitchen",
            "assigned_by": "Nutritionist",
            "instructions": "Teach children how to prepare sprouted moong chaat, yogurt fruit bowls, and understand food vitamins.",
            "status": "Completed",
            "completion_date": "2026-09-20",
            "remarks": "Children loved assembling their own vitamin-rich rainbow salads. Zero food waste recorded."
        },
        {
            "volunteer_name": "Deepa S",
            "event_name": "Mindfulness & Emotional Well-Being Circle",
            "description": "Guided relaxation, breathing stone techniques, emotions wheel sharing, and journaling for mental calmness.",
            "activity_type": "Extracurricular",
            "priority": "Low",
            "assigned_date": "2026-09-27",
            "scheduled_date": "2026-10-14",
            "due_date": "2026-10-14",
            "assigned_children": "12 Children",
            "location": "Quiet Meditation Pavilion",
            "assigned_by": "Child Psychologist",
            "instructions": "Facilitate breathing stones exercise, feelings wheel check-in, and guided gratitude reflection.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Deepa S",
            "event_name": "Clean Water & Disease Prevention Campaign",
            "description": "Sanitation awareness camp on clean drinking water storage, mosquito prevention, and hand washing milestones.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-28",
            "scheduled_date": "2026-10-18",
            "due_date": "2026-10-18",
            "assigned_children": "14 Children",
            "location": "Community Hall",
            "assigned_by": "Health Officer",
            "instructions": "Demonstrate UV filter maintenance, mosquito breeding prevention, and clean drinking habits.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Deepa S",
            "event_name": "Campus Herbal & Vegetable Garden Planting",
            "description": "Agricultural activity nurturing tulsi, mint, spinach, and tomatoes to promote connection with nature.",
            "activity_type": "Extracurricular",
            "priority": "Low",
            "assigned_date": "2026-09-21",
            "scheduled_date": "2026-10-01",
            "due_date": "2026-10-01",
            "assigned_children": "8 Children (Eco Club)",
            "location": "South Campus Garden Beds",
            "assigned_by": "Facility Manager",
            "instructions": "Plant tulsi, mint, spinach, and tomato saplings. Teach composting organic kitchen peelings.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "12 tomato saplings bedded. Drip irrigation line installed."
        },

        # =========================================================================
        # 7. PRIYA NAIR (Creative Performing Arts & Cognitive Skills)
        # =========================================================================
        {
            "volunteer_name": "Priya Nair",
            "event_name": "Classical Indian Vocal Warmups & Ragas",
            "description": "Vocal pitch calibration, sargam scales in Bilawal thaat, and melodic chorus harmonies.",
            "activity_type": "Arts and Crafts",
            "priority": "Medium",
            "assigned_date": "2026-09-21",
            "scheduled_date": "2026-09-30",
            "due_date": "2026-09-30",
            "assigned_children": "9 Children",
            "location": "Music Studio - Ground Floor",
            "assigned_by": "Cultural Lead",
            "instructions": "Teach sargam scales in Bilawal thaat, diaphragm breath support, and group chorus synchronization.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Children mastered the 8-note ascending scale. Beautiful group harmony achieved."
        },
        {
            "volunteer_name": "Priya Nair",
            "event_name": "Cognitive Strategy & Board Games League",
            "description": "Brain teaser challenges and tactical board games building lateral thinking, Scrabble words, and Carrom skills.",
            "activity_type": "Extracurricular",
            "priority": "Low",
            "assigned_date": "2026-09-23",
            "scheduled_date": "2026-10-07",
            "due_date": "2026-10-07",
            "assigned_children": "8 Children",
            "location": "Activity Room 2",
            "assigned_by": "Care Coordinator",
            "instructions": "Organize Scrabble, Carrom, and strategy games to build spatial and linguistic logic.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Priya Nair",
            "event_name": "Junior Financial Literacy & Piggy Bank Budgeting",
            "description": "Interactive economics workshop simulating saving goals, basic budgeting, and currency denomination math.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-14",
            "scheduled_date": "2026-09-22",
            "due_date": "2026-09-22",
            "assigned_children": "7 Children (Grade 7-8)",
            "location": "Classroom 3B",
            "assigned_by": "Academic Coordinator",
            "instructions": "Explain earning, saving, inflation, and bank account basics using play money simulations.",
            "status": "Completed",
            "completion_date": "2026-09-22",
            "remarks": "All 7 students drafted their personal weekly savings plans in mock passbooks."
        },
        {
            "volunteer_name": "Priya Nair",
            "event_name": "Sock Puppetry & Moral Fables Puppet Show",
            "description": "Constructing felt sock characters and performing interactive moral fables from Panchatantra.",
            "activity_type": "Arts and Crafts",
            "priority": "Low",
            "assigned_date": "2026-09-26",
            "scheduled_date": "2026-10-13",
            "due_date": "2026-10-13",
            "assigned_children": "11 Children (Junior Wing)",
            "location": "Junior Play Hall",
            "assigned_by": "Care Coordinator",
            "instructions": "Create expressive sock puppet animals with felt and buttons. Perform Panchatantra fables.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Priya Nair",
            "event_name": "Percussion Rhythms & Congo Drumming Workshop",
            "description": "Rhythm clapping, bongo synchronization, and polyrhythm drumming drills for musical coordination.",
            "activity_type": "Arts and Crafts",
            "priority": "Medium",
            "assigned_date": "2026-09-28",
            "scheduled_date": "2026-10-19",
            "due_date": "2026-10-19",
            "assigned_children": "10 Children",
            "location": "Music Studio",
            "assigned_by": "Cultural Lead",
            "instructions": "Teach four-beat syncopation, hand-drumming techniques on bongo drums, and call-and-response rhythm.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Priya Nair",
            "event_name": "Reading Comprehension & Critical Thinking Circle",
            "description": "Analysing mystery stories, deducing character motives, and practicing critical question-answering.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-22",
            "scheduled_date": "2026-10-03",
            "due_date": "2026-10-03",
            "assigned_children": "6 Children",
            "location": "Library Lounge",
            "assigned_by": "Education Lead",
            "instructions": "Read short mystery puzzles and encourage children to deduct clues before reading the reveal.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Solved 2 detective logic puzzles collaboratively."
        },

        # =========================================================================
        # 8. ANITHA (Early Learning & Sensory Development Volunteer)
        # =========================================================================
        {
            "volunteer_name": "Anitha",
            "event_name": "Sensory Play & Textured Material Discovery",
            "description": "Tactile sensory bins featuring kinetic sand, smooth river pebbles, and fabric matching for toddler development.",
            "activity_type": "Extracurricular",
            "priority": "Medium",
            "assigned_date": "2026-09-22",
            "scheduled_date": "2026-10-05",
            "due_date": "2026-10-05",
            "assigned_children": "6 Toddlers (Ages 3-5)",
            "location": "Early Childhood Playroom",
            "assigned_by": "Child Care Lead",
            "instructions": "Engage toddlers with sand trays, textured fabric swatches, and water bead sorting for motor development.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Anitha",
            "event_name": "Phonics Sounds & Alphabet Flashcard Games",
            "description": "Auditory phonetic drills associating vowel and consonant letter blends with illustrated animal flashcards.",
            "activity_type": "Education",
            "priority": "High",
            "assigned_date": "2026-09-20",
            "scheduled_date": "2026-09-29",
            "due_date": "2026-09-29",
            "assigned_children": "5 Children (Kindergarten)",
            "location": "Classroom 1A",
            "assigned_by": "Early Educator",
            "instructions": "Teach letter-sound associations using rhyming animal cards and sound matching games.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "Children mastered sounds for S, A, T, P, I, N with 90% accuracy."
        },
        {
            "volunteer_name": "Anitha",
            "event_name": "Building Block Architecture & Color Sorting",
            "description": "Constructive wooden block play teaching spatial balancing, geometric shapes, and primary color grouping.",
            "activity_type": "Education",
            "priority": "Low",
            "assigned_date": "2026-09-15",
            "scheduled_date": "2026-09-23",
            "due_date": "2026-09-23",
            "assigned_children": "7 Children",
            "location": "Playroom B",
            "assigned_by": "Care Coordinator",
            "instructions": "Use large wooden blocks to build bridges and castles; sort blocks by color and geometric shape.",
            "status": "Completed",
            "completion_date": "2026-09-23",
            "remarks": "Children constructed a 1.2m tall wooden bridge together cooperatively."
        },
        {
            "volunteer_name": "Anitha",
            "event_name": "Garden Nature Scavenger Hunt & Leaf Rubbings",
            "description": "Outdoor guided exploration identifying diverse leaves, pinecones, and creating colorful crayon wax rubbings.",
            "activity_type": "Extracurricular",
            "priority": "Low",
            "assigned_date": "2026-09-26",
            "scheduled_date": "2026-10-12",
            "due_date": "2026-10-12",
            "assigned_children": "10 Children",
            "location": "Campus Garden",
            "assigned_by": "Care Coordinator",
            "instructions": "Find 5 different leaf shapes, smooth pebbles, and create crayon leaf-rubbing art in scrapbooks.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        },
        {
            "volunteer_name": "Anitha",
            "event_name": "Interactive Sing-Along & Nursery Rhyme Theatre",
            "description": "Musical rhyming games with hand maracas, rhythmic clapping, and animated story songs.",
            "activity_type": "Arts and Crafts",
            "priority": "Low",
            "assigned_date": "2026-09-22",
            "scheduled_date": "2026-10-01",
            "due_date": "2026-10-01",
            "assigned_children": "8 Toddlers",
            "location": "Audio Room",
            "assigned_by": "Early Educator",
            "instructions": "Sing 'Old MacDonald' and 'Wheels on the Bus' with hand puppets and musical maracas.",
            "status": "In Progress",
            "completion_date": None,
            "remarks": "High engagement; toddlers joyfully mimicking animal sounds and actions."
        },
        {
            "volunteer_name": "Anitha",
            "event_name": "Basic Personal Etiquette & Golden Words Workshop",
            "description": "Manners and social communication workshop practicing 'Please', 'Thank you', and polite turn-taking.",
            "activity_type": "Education",
            "priority": "Medium",
            "assigned_date": "2026-09-25",
            "scheduled_date": "2026-10-08",
            "due_date": "2026-10-08",
            "assigned_children": "7 Children",
            "location": "Classroom 1A",
            "assigned_by": "Child Care Lead",
            "instructions": "Teach 'Please', 'Thank you', 'Excuse me', sharing toys, and taking turns through cartoon roleplays.",
            "status": "Pending",
            "completion_date": None,
            "remarks": None
        }
    ]

    print(f"\nInserting {len(distinct_activities)} distinct volunteer assignments...")
    created_count = 0
    for act in distinct_activities:
        vol = canonical_vols.get(act["volunteer_name"])
        if not vol:
            print(f"ERROR: Volunteer {act['volunteer_name']} not found in canonical_vols!")
            continue

        created_act = VolunteerAssignment.objects.create(
            volunteer=vol,
            event_name=act["event_name"],
            description=act["description"],
            activity_type=act["activity_type"],
            priority=act["priority"],
            assigned_date=act["assigned_date"],
            scheduled_date=act["scheduled_date"],
            due_date=act["due_date"],
            assigned_children=act["assigned_children"].split('(')[0].strip(),
            location=act["location"],
            assigned_by=act["assigned_by"],
            instructions=act["instructions"],
            status=act["status"],
            completion_date=act["completion_date"],
            remarks=act["remarks"],
            feedback=act["remarks"]
        )
        created_count += 1
        print(f"  [#{created_act.assignment_id}] {vol.full_name:15s} | '{created_act.event_name}' ({created_act.activity_type}) [{created_act.status}]")

    print("\n" + "=" * 70)
    print(f"SUCCESS: Seeded {created_count} completely distinct activities across all {len(canonical_vols)} volunteers!")
    print("=" * 70)

if __name__ == '__main__':
    seed_tasks()

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// S1: Special programs & constituent-college prominence — top 100 colleges (ranking 1-100).
// prominence: 1 = flagship jewel, 2 = notable, 3 = solid.
// sourceUrl: explicit official page where known with confidence; otherwise the
// script falls back to the college's main website (domain-level source until X1).

type ProgramType =
  | 'constituent-school'
  | 'honors-college'
  | 'co-op'
  | 'research'
  | 'accelerated'
  | 'study-abroad'
  | 'other';

interface ProgramSeed {
  name: string;
  type: ProgramType;
  prominence: 1 | 2 | 3;
  description: string;
  knownFor?: string;
  sourceUrl?: string;
}

// Keyed by the exact `name` field in the College table.
const PROGRAMS: Record<string, ProgramSeed[]> = {
  'Princeton University': [
    { name: 'School of Public and International Affairs', type: 'constituent-school', prominence: 1, description: 'One of the most prestigious undergraduate public-policy programs in the country, with small task-force seminars and deep Washington connections.', knownFor: 'Public Policy, International Affairs' },
    { name: 'Universal Senior Thesis', type: 'research', prominence: 2, description: 'Every Princeton senior completes an original, faculty-mentored thesis — a signature of the university\'s undergraduate-first research culture.' },
    { name: 'Novogratz Bridge Year Program', type: 'study-abroad', prominence: 3, description: 'A tuition-free gap year of service abroad for admitted students before freshman year.' },
  ],
  'Massachusetts Institute of Technology': [
    { name: 'School of Engineering', type: 'constituent-school', prominence: 1, description: 'The top-ranked engineering school in the world and home to most MIT undergraduates.', knownFor: 'EECS, Mechanical Engineering, AI' },
    { name: 'UROP (Undergraduate Research Opportunities Program)', type: 'research', prominence: 1, description: 'The pioneering undergraduate research program — about 90% of MIT students do paid, credit-bearing research with faculty.' },
    { name: 'MIT Sloan Undergraduate Program', type: 'constituent-school', prominence: 2, description: 'Business and management analytics majors inside one of the world\'s leading business schools.', knownFor: 'Business Analytics, Finance' },
    { name: 'MISTI Global Internships', type: 'study-abroad', prominence: 3, description: 'Fully-funded international internships and research placements in 25+ countries.' },
  ],
  'Harvard University': [
    { name: 'John A. Paulson School of Engineering and Applied Sciences', type: 'constituent-school', prominence: 2, description: 'Harvard\'s fast-growing engineering school, with much of it housed in the new Allston science campus.', knownFor: 'Applied Math, CS, Bioengineering' },
    { name: 'Undergraduate Research (via 100+ affiliated labs and hospitals)', type: 'research', prominence: 2, description: 'Term-time and summer research across Harvard\'s labs, teaching hospitals, and institutes — a major draw for pre-meds.' },
    { name: 'Concurrent A.B./S.M. Program', type: 'accelerated', prominence: 3, description: 'Qualified students earn a master\'s degree alongside the bachelor\'s in four years.' },
  ],
  'Stanford University': [
    { name: 'School of Engineering', type: 'constituent-school', prominence: 1, description: 'The heart of Silicon Valley\'s talent pipeline and one of the top two engineering schools in the country.', knownFor: 'CS, EE, Bioengineering' },
    { name: 'CS+X Joint Majors', type: 'other', prominence: 2, description: 'Joint majors pairing computer science with humanities fields like English or Music — a distinctly Stanford path.' },
    { name: 'Hasso Plattner Institute of Design (d.school)', type: 'other', prominence: 2, description: 'The birthplace of design thinking; undergraduates from any major can take its project-based classes.' },
    { name: 'Bing Overseas Studies Program', type: 'study-abroad', prominence: 3, description: 'Stanford-run campuses and programs in 10+ international locations.' },
  ],
  'Yale University': [
    { name: 'Residential College System', type: 'other', prominence: 2, description: 'All undergraduates belong to one of 14 residential colleges — the defining feature of Yale student life.' },
    { name: 'Directed Studies', type: 'other', prominence: 2, description: 'A selective first-year great-books program regarded as one of the best humanities foundations anywhere.' },
    { name: 'Yale School of Music / Department of Music ties', type: 'constituent-school', prominence: 3, description: 'Undergraduates access conservatory-level instruction through Yale\'s world-class music faculty.' },
  ],
  'California Institute of Technology': [
    { name: 'SURF (Summer Undergraduate Research Fellowships)', type: 'research', prominence: 1, description: 'Caltech\'s flagship program places most undergraduates in serious faculty research, often leading to publication.' },
    { name: 'Core Curriculum in Math & Science', type: 'other', prominence: 2, description: 'Every student — regardless of major — completes rigorous math and physics core, creating an intensely quantitative culture.' },
    { name: 'JPL Research Connections', type: 'research', prominence: 2, description: 'NASA\'s Jet Propulsion Laboratory, managed by Caltech, offers undergraduates space-mission research and internships.' },
  ],
  'Duke University': [
    { name: 'Pratt School of Engineering', type: 'constituent-school', prominence: 1, description: 'Duke\'s engineering school, nationally prominent in biomedical engineering.', knownFor: 'Biomedical Engineering, ECE' },
    { name: 'DukeEngage', type: 'study-abroad', prominence: 2, description: 'Fully-funded summer of civic engagement domestically or abroad — a signature Duke experience.' },
    { name: 'Bass Connections', type: 'research', prominence: 2, description: 'Interdisciplinary, project-based research teams pairing undergraduates with faculty and graduate students.' },
  ],
  'Johns Hopkins University': [
    { name: 'Department of Biomedical Engineering (Whiting School)', type: 'constituent-school', prominence: 1, description: 'The #1-ranked BME program in the country, with direct ties to the Johns Hopkins School of Medicine.', knownFor: 'Biomedical Engineering' },
    { name: 'Peabody Institute', type: 'constituent-school', prominence: 2, description: 'One of America\'s leading music conservatories, with double-degree options for Homewood students.', knownFor: 'Music Performance, Composition' },
    { name: 'Undergraduate Research (80%+ participation)', type: 'research', prominence: 2, description: 'Hopkins is America\'s first research university; most undergraduates do faculty-mentored research, especially in medicine and public health.' },
  ],
  'University of Pennsylvania': [
    { name: 'The Wharton School', type: 'constituent-school', prominence: 1, description: 'The most famous undergraduate business school in the world; admission is notably harder than Penn overall.', knownFor: 'Finance, Management, Entrepreneurship', sourceUrl: 'https://www.wharton.upenn.edu/' },
    { name: 'Jerome Fisher Program in Management & Technology', type: 'accelerated', prominence: 2, description: 'Ultra-selective dual degree combining Wharton and Penn Engineering in four years.' },
    { name: 'School of Nursing', type: 'constituent-school', prominence: 2, description: 'Consistently ranked the #1 nursing school in the country.', knownFor: 'Nursing' },
    { name: 'Huntsman Program in International Studies & Business', type: 'accelerated', prominence: 3, description: 'Dual degree in business (Wharton) and international studies with advanced language study.' },
  ],
  'Northwestern University': [
    { name: 'Medill School of Journalism', type: 'constituent-school', prominence: 1, description: 'The most storied journalism school in the country, with required professional residencies.', knownFor: 'Journalism, Marketing Communications', sourceUrl: 'https://www.medill.northwestern.edu/' },
    { name: 'McCormick School of Engineering', type: 'constituent-school', prominence: 2, description: 'Top-15 engineering school known for its whole-brain, design-focused curriculum.', knownFor: 'Industrial Engineering, Materials Science' },
    { name: 'School of Communication', type: 'constituent-school', prominence: 2, description: 'Elite theatre, radio/TV/film, and communication programs with a deep Hollywood and Broadway alumni network.', knownFor: 'Theatre, RTVF' },
  ],
  'University of Chicago': [
    { name: 'Department of Economics', type: 'other', prominence: 1, description: 'Home of the "Chicago School" — more Nobel laureates in economics than any other institution; economics is the most popular major.', knownFor: 'Economics' },
    { name: 'The Core Curriculum', type: 'other', prominence: 2, description: 'The famous common core of foundational courses that defines UChicago\'s intense intellectual culture.' },
    { name: 'Study Abroad Centers (Paris, London, Hong Kong)', type: 'study-abroad', prominence: 3, description: 'UChicago-run centers abroad where faculty teach Core courses in-residence.' },
  ],
  'Brown University': [
    { name: 'The Open Curriculum', type: 'other', prominence: 1, description: 'No distribution requirements — students design their own education. The defining feature of Brown.' },
    { name: 'Program in Liberal Medical Education (PLME)', type: 'accelerated', prominence: 1, description: 'An eight-year combined BA/MD — the only Ivy League direct-med program, and among the most selective programs in the country.', knownFor: 'BS/MD' },
    { name: 'Brown-RISD Dual Degree', type: 'accelerated', prominence: 2, description: 'Five-year dual degree with the Rhode Island School of Design for artist-scholars.' },
  ],
  'Cornell University': [
    { name: 'Nolan School of Hotel Administration', type: 'constituent-school', prominence: 1, description: 'The world\'s premier hospitality business program — a Cornell signature.', knownFor: 'Hospitality, Real Estate' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 2, description: 'The largest and among the strongest of the Ivy engineering schools.', knownFor: 'CS, Operations Research, ECE' },
    { name: 'Dyson School of Applied Economics and Management', type: 'constituent-school', prominence: 2, description: 'Cornell\'s undergraduate business program — one of the most selective majors in the university.', knownFor: 'Business, Applied Economics' },
    { name: 'School of Industrial and Labor Relations (ILR)', type: 'constituent-school', prominence: 3, description: 'The only school of its kind in the country; a pipeline to HR leadership, law, and labor policy.' },
  ],
  'Rice University': [
    { name: 'Rice/Baylor Medical Scholars Program', type: 'accelerated', prominence: 1, description: 'Guaranteed admission to Baylor College of Medicine for a handful of entering freshmen — one of the most selective programs in the US.', knownFor: 'BS/MD' },
    { name: 'Residential College System', type: 'other', prominence: 2, description: 'Eleven residential colleges give Rice a famously tight-knit, egalitarian campus culture.' },
    { name: 'Shepherd School of Music', type: 'constituent-school', prominence: 2, description: 'A top-tier conservatory-level music school inside a research university.', knownFor: 'Music Performance' },
    { name: 'George R. Brown School of Engineering', type: 'constituent-school', prominence: 2, description: 'Strong engineering school with close ties to the Texas Medical Center and Houston\'s energy industry.', knownFor: 'Bioengineering, CS' },
  ],
  'Dartmouth College': [
    { name: 'The D-Plan (Quarter System)', type: 'other', prominence: 2, description: 'Flexible year-round quarter calendar that makes off-cycle internships and the sophomore-summer-on-campus tradition possible.' },
    { name: 'Thayer School of Engineering', type: 'constituent-school', prominence: 2, description: 'Human-centered engineering school where all students earn a broad AB in engineering sciences first.', knownFor: 'Engineering Sciences' },
    { name: 'Off-Campus Programs (50+ worldwide)', type: 'study-abroad', prominence: 3, description: 'More than half of Dartmouth students study abroad on faculty-led language and department programs.' },
  ],
  'Vanderbilt University': [
    { name: 'Peabody College of Education and Human Development', type: 'constituent-school', prominence: 1, description: 'Routinely ranked among the very best education schools in America; also home to the popular Human & Organizational Development major.', knownFor: 'Education, Human & Organizational Development' },
    { name: 'Blair School of Music', type: 'constituent-school', prominence: 2, description: 'Undergraduate-only conservatory offering elite performance training without graduate students competing for attention.', knownFor: 'Music Performance' },
    { name: 'School of Engineering', type: 'constituent-school', prominence: 3, description: 'Small, collaborative engineering school with strong biomedical ties to Vanderbilt University Medical Center.' },
  ],
  'University of Notre Dame': [
    { name: 'Mendoza College of Business', type: 'constituent-school', prominence: 1, description: 'Consistently a top-10 undergraduate business school with an exceptionally loyal alumni hiring network.', knownFor: 'Finance, Accounting' },
    { name: 'Notre Dame Global Gateways', type: 'study-abroad', prominence: 2, description: 'Roughly three-quarters of students study abroad through Notre Dame\'s own centers in Rome, London, Dublin, and beyond.' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 3, description: 'Solid engineering college within a school better known for business and the liberal arts.' },
  ],
  'Columbia University in the City of New York': [
    { name: 'The Core Curriculum', type: 'other', prominence: 1, description: 'The century-old great-books Core is Columbia\'s intellectual signature and shared undergraduate experience.' },
    { name: 'Fu Foundation School of Engineering and Applied Science', type: 'constituent-school', prominence: 2, description: 'Ivy League engineering in Manhattan, with strong applied math, CS, and financial engineering.', knownFor: 'CS, Applied Math, Financial Engineering' },
    { name: 'Dual BA Programs (Sciences Po, Trinity College Dublin, Tel Aviv)', type: 'study-abroad', prominence: 3, description: 'Four-year dual bachelor\'s degrees split between Columbia and a partner university abroad.' },
  ],
  'Washington University in St Louis': [
    { name: 'Olin Business School', type: 'constituent-school', prominence: 1, description: 'Top-15 undergraduate business school with unusually easy double-majoring across the university.', knownFor: 'Finance, Marketing' },
    { name: 'Sam Fox School of Design & Visual Arts', type: 'constituent-school', prominence: 2, description: 'Nationally ranked art and architecture school integrated with a research university.', knownFor: 'Architecture, Communication Design' },
    { name: 'Pre-Med / Biomedical Pipeline', type: 'other', prominence: 2, description: 'WashU\'s elite medical school anchors one of the strongest pre-med environments in the country.' },
  ],
  'University of California-Los Angeles': [
    { name: 'School of Theater, Film and Television', type: 'constituent-school', prominence: 1, description: 'One of the top film schools in the world, embedded in the entertainment capital.', knownFor: 'Film, Television, Theater' },
    { name: 'Samueli School of Engineering', type: 'constituent-school', prominence: 2, description: 'Top-20 engineering school with highly competitive CS admissions.', knownFor: 'CS, Bioengineering' },
    { name: 'Undergraduate Research Centers', type: 'research', prominence: 3, description: 'Dedicated centers place thousands of undergraduates into faculty research every year.' },
  ],
  'University of California-Berkeley': [
    { name: 'College of Engineering & EECS', type: 'constituent-school', prominence: 1, description: 'Berkeley EECS is a global top-3 program; admission to the College of Engineering is far more selective than to Berkeley overall.', knownFor: 'EECS, CS, Bioengineering' },
    { name: 'Haas School of Business', type: 'constituent-school', prominence: 1, description: 'Top-3 undergraduate business school; students apply for the final two years.', knownFor: 'Business', sourceUrl: 'https://haas.berkeley.edu/' },
    { name: 'Management, Entrepreneurship & Technology (M.E.T.)', type: 'accelerated', prominence: 2, description: 'Simultaneous degrees from Haas and Engineering in four years — one of the most selective programs in the UC system.' },
    { name: 'College of Chemistry', type: 'constituent-school', prominence: 2, description: 'A standalone chemistry college ranked #1 in the world in its field.', knownFor: 'Chemistry, Chemical Engineering' },
  ],
  'University of Michigan-Ann Arbor': [
    { name: 'Ross School of Business', type: 'constituent-school', prominence: 1, description: 'Top-5 undergraduate business school famous for action-based learning.', knownFor: 'Business, Consulting pipeline', sourceUrl: 'https://michiganross.umich.edu/' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 1, description: 'Top-10 engineering school with more than a dozen top-ranked departments.', knownFor: 'Aerospace, CS, Industrial Engineering' },
    { name: 'School of Music, Theatre & Dance', type: 'constituent-school', prominence: 2, description: 'Conservatory-caliber performing arts, especially musical theatre, inside a Big Ten university.', knownFor: 'Musical Theatre' },
    { name: 'UROP (Undergraduate Research Opportunity Program)', type: 'research', prominence: 3, description: 'One of the nation\'s largest first-and-second-year research placement programs.' },
  ],
  'Emory University': [
    { name: 'Goizueta Business School', type: 'constituent-school', prominence: 1, description: 'Top-15 undergraduate business school with strong consulting and finance placement in the Southeast and beyond.', knownFor: 'Finance, Consulting' },
    { name: 'Nell Hodgson Woodruff School of Nursing', type: 'constituent-school', prominence: 2, description: 'One of the top-ranked BSN programs in the country, adjacent to Emory\'s hospital system and the CDC.', knownFor: 'Nursing' },
    { name: 'Oxford College', type: 'constituent-school', prominence: 2, description: 'A small liberal-arts start campus where some students spend their first two years before continuing in Atlanta.' },
  ],
  'Georgetown University': [
    { name: 'Edmund A. Walsh School of Foreign Service', type: 'constituent-school', prominence: 1, description: 'The premier school of international affairs in the country — often harder to get into than Georgetown College.', knownFor: 'International Politics, Security Studies', sourceUrl: 'https://sfs.georgetown.edu/' },
    { name: 'McDonough School of Business', type: 'constituent-school', prominence: 2, description: 'Top-tier undergraduate business school steps from Washington\'s policy and finance worlds.', knownFor: 'Finance, International Business' },
    { name: 'Capitol Hill & Government Internships', type: 'other', prominence: 3, description: 'Georgetown students routinely intern in Congress, agencies, and think tanks during the semester.' },
  ],
  'University of Virginia-Main Campus': [
    { name: 'McIntire School of Commerce', type: 'constituent-school', prominence: 1, description: 'Perennial top-5 undergraduate business school; students enter after two years in the college.', knownFor: 'Commerce, Finance' },
    { name: 'Echols Scholars Program', type: 'honors-college', prominence: 2, description: 'UVA\'s honors track: unrestricted curriculum, priority registration, and honors housing.' },
    { name: 'Frank Batten School of Leadership and Public Policy', type: 'constituent-school', prominence: 3, description: 'Undergraduate public-policy degrees in Jefferson\'s university, minutes from Washington-bound networks.' },
  ],
  'Carnegie Mellon University': [
    { name: 'School of Computer Science', type: 'constituent-school', prominence: 1, description: 'Arguably the #1 computer science school in the world; SCS admission is dramatically more selective than CMU overall.', knownFor: 'CS, AI, Robotics', sourceUrl: 'https://www.cs.cmu.edu/' },
    { name: 'School of Drama', type: 'constituent-school', prominence: 1, description: 'The oldest drama degree program in the US and a top-3 theater conservatory (acting, musical theater, design).', knownFor: 'Acting, Musical Theatre, Design' },
    { name: 'Tepper School of Business', type: 'constituent-school', prominence: 2, description: 'Quantitative, analytics-driven undergraduate business program.', knownFor: 'Quantitative Finance, Business Analytics' },
  ],
  'University of North Carolina at Chapel Hill': [
    { name: 'Kenan-Flagler Business School', type: 'constituent-school', prominence: 1, description: 'Top-10 undergraduate business school; students apply as sophomores.', knownFor: 'Business, Finance' },
    { name: 'Hussman School of Journalism and Media', type: 'constituent-school', prominence: 2, description: 'One of the country\'s leading journalism and media schools.', knownFor: 'Journalism, Advertising/PR' },
    { name: 'Honors Carolina', type: 'honors-college', prominence: 2, description: 'Honors program with small seminars, research funding, and its own study-abroad sites.' },
  ],
  'Wake Forest University': [
    { name: 'School of Business', type: 'constituent-school', prominence: 2, description: 'Highly regarded undergraduate business school with a #1-ranked accounting CPA pass-rate pedigree.', knownFor: 'Accounting, Finance' },
    { name: 'Wake Forest Study Abroad (Casa Artom, Worrell House, Flow House)', type: 'study-abroad', prominence: 2, description: 'Wake owns residential houses in Venice, London, and Vienna; a majority of students study abroad.' },
    { name: 'Wake Downtown', type: 'constituent-school', prominence: 3, description: 'Engineering and biomedical sciences programs in the renovated Innovation Quarter downtown.' },
  ],
  'Stony Brook University': [
    { name: 'College of Engineering and Applied Sciences', type: 'constituent-school', prominence: 2, description: 'Strong, affordable engineering and CS programs — Stony Brook\'s applied math department is nationally ranked.', knownFor: 'CS, Applied Math & Statistics' },
    { name: 'Scholars for Medicine (BS/MD)', type: 'accelerated', prominence: 2, description: 'Eight-year combined degree with the Renaissance School of Medicine for a small cohort of entering freshmen.', knownFor: 'BS/MD' },
    { name: 'Brookhaven National Laboratory Partnership', type: 'research', prominence: 2, description: 'Stony Brook co-manages the nearby DOE national lab, opening serious physics and energy research to undergraduates.' },
  ],
  'University of Florida': [
    { name: 'Warrington College of Business (Heavener School)', type: 'constituent-school', prominence: 1, description: 'UF\'s flagship college — a top-ranked public undergraduate business school.', knownFor: 'Finance, Marketing' },
    { name: 'Herbert Wertheim College of Engineering', type: 'constituent-school', prominence: 2, description: 'Large top-tier public engineering college with major research funding.', knownFor: 'CS, Industrial Engineering' },
    { name: 'UF Honors Program', type: 'honors-college', prominence: 3, description: 'Smaller classes, honors housing, and research placement within the state flagship.' },
  ],
  'University of Southern California': [
    { name: 'School of Cinematic Arts', type: 'constituent-school', prominence: 1, description: 'The most famous film school in the world — the jewel of USC, with an unmatched Hollywood alumni network.', knownFor: 'Film & TV Production, Screenwriting, Games', sourceUrl: 'https://cinema.usc.edu/' },
    { name: 'Marshall School of Business', type: 'constituent-school', prominence: 2, description: 'Top-10 undergraduate business school; the World Bachelor in Business spans three continents.', knownFor: 'Business, Entrepreneurship' },
    { name: 'Viterbi School of Engineering', type: 'constituent-school', prominence: 2, description: 'Top-10 engineering school with a large CS and games pipeline into tech and entertainment.', knownFor: 'CS, Games' },
    { name: 'Iovine and Young Academy', type: 'other', prominence: 3, description: 'The "arts, technology and business of innovation" degree founded by Jimmy Iovine and Dr. Dre.' },
  ],
  'Tufts University': [
    { name: 'International Relations Program', type: 'other', prominence: 1, description: 'Tufts\' signature undergraduate program, drawing on the Fletcher School\'s global-affairs legacy.', knownFor: 'International Relations' },
    { name: 'School of the Museum of Fine Arts (SMFA)', type: 'constituent-school', prominence: 2, description: 'A full art school within Tufts, offering combined BFA/BA degrees.', knownFor: 'Studio Art' },
    { name: 'School of Engineering', type: 'constituent-school', prominence: 3, description: 'Small engineering school known for human factors and biomedical engineering.' },
  ],
  'University of California-San Diego': [
    { name: 'Jacobs School of Engineering', type: 'constituent-school', prominence: 1, description: 'Top-10 public engineering school; bioengineering and CS are standouts.', knownFor: 'Bioengineering, CS' },
    { name: 'Scripps Institution of Oceanography', type: 'research', prominence: 2, description: 'One of the world\'s premier ocean and earth science centers — undergraduates can major and do research there.', knownFor: 'Oceanography, Climate Science' },
    { name: 'The College System', type: 'other', prominence: 3, description: 'Eight small residential colleges, each with its own general-education philosophy, break up the big campus.' },
  ],
  'University of California-Davis': [
    { name: 'College of Agricultural and Environmental Sciences', type: 'constituent-school', prominence: 1, description: 'The #1-ranked agriculture program in the world; animal science is a famous pre-vet pipeline.', knownFor: 'Animal Science, Viticulture & Enology, Environmental Science' },
    { name: 'College of Biological Sciences', type: 'constituent-school', prominence: 2, description: 'A standalone biology college — rare nationally — feeding UC Davis\' top-ranked veterinary school.', knownFor: 'Biology, Neurobiology' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 3, description: 'Strong public engineering college, notably in biological and agricultural engineering.' },
  ],
  'The University of Texas at Austin': [
    { name: 'McCombs School of Business', type: 'constituent-school', prominence: 1, description: 'Top-5 public undergraduate business school and a direct pipeline into Texas\' corporate and startup worlds.', knownFor: 'Finance, MIS, Accounting', sourceUrl: 'https://www.mccombs.utexas.edu/' },
    { name: 'Cockrell School of Engineering', type: 'constituent-school', prominence: 1, description: 'Top-10 engineering school; petroleum, civil, and aerospace are nationally elite.', knownFor: 'Petroleum, Aerospace, ECE' },
    { name: 'Department of Computer Science', type: 'other', prominence: 2, description: 'Top-10 CS program with its own highly selective admission and the Turing Scholars honors track.', knownFor: 'CS, AI' },
    { name: 'Plan II Honors', type: 'honors-college', prominence: 2, description: 'One of the oldest and most respected liberal-arts honors programs in the country.' },
  ],
  'University of Wisconsin-Madison': [
    { name: 'College of Engineering', type: 'constituent-school', prominence: 1, description: 'Top-15 public engineering college with deep industry ties across the Midwest.', knownFor: 'Industrial, Chemical, CS' },
    { name: 'Wisconsin School of Business', type: 'constituent-school', prominence: 2, description: 'Strong direct-admit undergraduate business school with standout real estate and risk programs.', knownFor: 'Real Estate, Risk Management' },
    { name: 'School of Education', type: 'constituent-school', prominence: 2, description: 'Perennially one of the top education schools in the nation.', knownFor: 'Education' },
  ],
  'University of Illinois Urbana-Champaign': [
    { name: 'Grainger College of Engineering', type: 'constituent-school', prominence: 1, description: 'A global top-10 engineering school and the jewel of UIUC — admission to Grainger CS is far more selective than to the university overall.', knownFor: 'CS, ECE, Aerospace', sourceUrl: 'https://grainger.illinois.edu/' },
    { name: 'CS + X Blended Degrees', type: 'other', prominence: 2, description: 'Popular blended majors pairing Grainger computer science with fields from advertising to music.', knownFor: 'CS + X' },
    { name: 'Gies College of Business', type: 'constituent-school', prominence: 2, description: 'Top-tier public business school known for accountancy.', knownFor: 'Accountancy, Finance' },
    { name: 'James Scholar Honors Program', type: 'honors-college', prominence: 3, description: 'College-level honors designation with priority registration and honors credit learning agreements.' },
  ],
  'William & Mary': [
    { name: 'Raymond A. Mason School of Business', type: 'constituent-school', prominence: 2, description: 'Well-regarded undergraduate business school inside the country\'s second-oldest college.', knownFor: 'Business Analytics, Finance' },
    { name: 'St Andrews William & Mary Joint Degree Programme', type: 'study-abroad', prominence: 2, description: 'A four-year BA split evenly between Williamsburg and the University of St Andrews in Scotland.' },
    { name: 'Government & Public Policy Pipeline', type: 'other', prominence: 3, description: 'A historic feeder into public service, close to Washington and Richmond.' },
  ],
  'Georgia Institute of Technology-Main Campus': [
    { name: 'College of Engineering', type: 'constituent-school', prominence: 1, description: 'The largest engineering college in the US and top-5 in nearly every discipline.', knownFor: 'Industrial, Aerospace, ECE' },
    { name: 'College of Computing', type: 'constituent-school', prominence: 1, description: 'Top-10 computing college whose threads curriculum lets students specialize early.', knownFor: 'CS, AI, Cybersecurity' },
    { name: 'Cooperative Education Program', type: 'co-op', prominence: 2, description: 'One of the oldest and largest voluntary co-op programs in the country — five-year degree with alternating paid work terms.' },
    { name: 'Scheller College of Business', type: 'constituent-school', prominence: 3, description: 'Tech-flavored business school benefiting from Georgia Tech\'s recruiting gravity.' },
  ],
  'Case Western Reserve University': [
    { name: 'Pre-Professional Scholars Program (BS/MD)', type: 'accelerated', prominence: 1, description: 'Guaranteed admission to Case\'s School of Medicine for a small group of entering freshmen.', knownFor: 'BS/MD' },
    { name: 'Case School of Engineering', type: 'constituent-school', prominence: 2, description: 'Strong engineering school with deep ties to Cleveland\'s hospital systems.', knownFor: 'Biomedical Engineering' },
    { name: 'Cooperative Education Program', type: 'co-op', prominence: 2, description: 'Optional paid co-op rotations with employers like NASA Glenn and the Cleveland Clinic.' },
  ],
  'Boston University': [
    { name: 'Seven-Year Accelerated Medical Program', type: 'accelerated', prominence: 1, description: 'One of the oldest combined BA/MD programs in the country, leading to BU\'s Chobanian & Avedisian School of Medicine.', knownFor: 'BA/MD' },
    { name: 'College of Communication', type: 'constituent-school', prominence: 2, description: 'A top communication school for journalism, film & TV, and PR in a major media market.', knownFor: 'Journalism, Film & TV' },
    { name: 'Questrom School of Business', type: 'constituent-school', prominence: 2, description: 'Large, well-ranked undergraduate business school.', knownFor: 'Business, Finance' },
    { name: 'BU Study Abroad', type: 'study-abroad', prominence: 3, description: 'One of the largest university-run study-abroad networks, with internship-integrated programs.' },
  ],
  'Ohio State University Agricultural Technical Institute': [
    { name: 'Fisher College of Business', type: 'constituent-school', prominence: 1, description: 'Ohio State\'s top-ranked public business school with a massive alumni network.', knownFor: 'Logistics, Finance, Accounting' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 2, description: 'Large top-tier public engineering college; welding engineering is nationally unique.', knownFor: 'CS, Welding Engineering, Aerospace' },
    { name: 'Honors & Scholars Programs', type: 'honors-college', prominence: 2, description: 'University Honors plus themed Scholars living-learning communities shrink the giant campus.' },
  ],
  'Purdue University-Main Campus': [
    { name: 'College of Engineering', type: 'constituent-school', prominence: 1, description: 'Top-5 public engineering college — the "Cradle of Astronauts" with 25+ alumni astronauts.', knownFor: 'Aeronautics & Astronautics, Mechanical, ECE' },
    { name: 'Cooperative Education Program', type: 'co-op', prominence: 2, description: 'Century-old co-op program alternating study with paid professional rotations.' },
    { name: 'Department of Computer Science', type: 'other', prominence: 2, description: 'Top-20 CS department with a dedicated Data Science major.', knownFor: 'CS, Cybersecurity' },
    { name: 'John Martinson Honors College', type: 'honors-college', prominence: 3, description: 'Residential honors college with interdisciplinary project curriculum.' },
  ],
  'University of Rochester': [
    { name: 'Eastman School of Music', type: 'constituent-school', prominence: 1, description: 'One of the world\'s great music conservatories — the jewel of Rochester.', knownFor: 'Music Performance, Jazz, Composition' },
    { name: 'The Rochester Curriculum', type: 'other', prominence: 2, description: 'No required subjects outside your chosen clusters — an open-curriculum cousin unique among research universities.' },
    { name: 'Rochester Early Medical Scholars (REMS)', type: 'accelerated', prominence: 2, description: 'Eight-year BA/BS + MD with guaranteed admission to Rochester\'s medical school.', knownFor: 'BS/MD' },
    { name: 'Institute of Optics', type: 'research', prominence: 2, description: 'America\'s first optics institute — a niche Rochester superpower tied to the local imaging industry.', knownFor: 'Optics' },
  ],
  'Lehigh University': [
    { name: 'P.C. Rossin College of Engineering and Applied Science', type: 'constituent-school', prominence: 1, description: 'Lehigh\'s historic strength — a top engineering school with strong Wall Street and industry placement.', knownFor: 'Industrial Engineering, Materials' },
    { name: 'Integrated Business and Engineering (IBE) Honors', type: 'honors-college', prominence: 2, description: 'Selective four-year honors program blending the business and engineering colleges.' },
    { name: 'College of Business', type: 'constituent-school', prominence: 2, description: 'Well-ranked undergraduate business school known for finance and supply chain.', knownFor: 'Finance, Supply Chain' },
  ],
  'Texas A&M University-College Station': [
    { name: 'College of Engineering', type: 'constituent-school', prominence: 1, description: 'One of the largest and best public engineering colleges; petroleum and nuclear engineering are top-ranked.', knownFor: 'Petroleum, Nuclear, Aerospace' },
    { name: 'Mays Business School', type: 'constituent-school', prominence: 2, description: 'Top-25 public business school backed by the famous Aggie hiring network.', knownFor: 'Business, Supply Chain' },
    { name: 'Corps of Cadets', type: 'other', prominence: 2, description: 'The largest uniformed student body outside the service academies — a leadership path with or without military service.' },
  ],
  'Boston College': [
    { name: 'Carroll School of Management', type: 'constituent-school', prominence: 1, description: 'Top-5 undergraduate business school with elite finance placement.', knownFor: 'Finance, Accounting' },
    { name: 'Connell School of Nursing', type: 'constituent-school', prominence: 2, description: 'Highly ranked direct-entry BSN program in the Boston medical ecosystem.', knownFor: 'Nursing' },
    { name: 'Lynch School of Education and Human Development', type: 'constituent-school', prominence: 3, description: 'Well-regarded education school with applied psychology and human development majors.' },
  ],
  'Rutgers University-Camden': [
    { name: 'Rutgers Business School', type: 'constituent-school', prominence: 1, description: 'Rutgers\' well-ranked business school, with strong supply chain and finance placement into the NY/NJ corridor.', knownFor: 'Supply Chain, Finance' },
    { name: 'Honors College', type: 'honors-college', prominence: 2, description: 'Selective living-learning honors community with dedicated advising and scholarships.' },
    { name: 'Ernest Mario School of Pharmacy (0-6 PharmD)', type: 'accelerated', prominence: 2, description: 'Direct-entry six-year Doctor of Pharmacy program — a rare guaranteed pharmacy path.', knownFor: 'PharmD' },
  ],
  'University of Georgia': [
    { name: 'Morehead Honors College', type: 'honors-college', prominence: 1, description: 'One of the nation\'s elite public honors colleges, home to the Foundation Fellowship.', },
    { name: 'Grady College of Journalism and Mass Communication', type: 'constituent-school', prominence: 2, description: 'Storied journalism school that administers the Peabody Awards.', knownFor: 'Journalism, Advertising' },
    { name: 'Terry College of Business', type: 'constituent-school', prominence: 2, description: 'Fast-rising public business school feeding Atlanta\'s corporate headquarters.', knownFor: 'Risk Management & Insurance, Finance' },
  ],
  'Villanova University': [
    { name: 'Villanova School of Business', type: 'constituent-school', prominence: 1, description: 'Top-tier undergraduate business school and Villanova\'s biggest academic draw.', knownFor: 'Finance, Accounting' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 2, description: 'Solid engineering college with a strong service-learning tradition.', knownFor: 'Civil, Mechanical' },
    { name: 'M. Louise Fitzpatrick College of Nursing', type: 'constituent-school', prominence: 2, description: 'Highly ranked direct-entry nursing college.', knownFor: 'Nursing' },
  ],
  'University of Washington-Seattle Campus': [
    { name: 'Paul G. Allen School of Computer Science & Engineering', type: 'constituent-school', prominence: 1, description: 'Global top-10 CS program in Amazon and Microsoft\'s backyard; direct-to-major admission is fiercely competitive.', knownFor: 'CS, AI, Systems' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 2, description: 'Top public engineering college with aerospace ties to Boeing.', knownFor: 'Aeronautics, Bioengineering' },
    { name: 'Foster School of Business', type: 'constituent-school', prominence: 2, description: 'Top-20 undergraduate business school in a booming tech economy.', knownFor: 'Business, Information Systems' },
  ],
  'Florida State University': [
    { name: 'College of Motion Picture Arts', type: 'constituent-school', prominence: 1, description: 'One of the top film schools in the country, with tiny cohorts and hands-on production from day one.', knownFor: 'Film Production', sourceUrl: 'https://film.fsu.edu/' },
    { name: 'Jim Moran College of Entrepreneurship', type: 'constituent-school', prominence: 2, description: 'One of the first standalone entrepreneurship colleges in the nation.', knownFor: 'Entrepreneurship' },
    { name: 'FSU Honors Program', type: 'honors-college', prominence: 3, description: 'Honors seminars, thesis track, and priority registration at the state\'s designated preeminent university.' },
  ],
  'Rensselaer Polytechnic Institute': [
    { name: 'School of Engineering', type: 'constituent-school', prominence: 1, description: 'America\'s oldest technological university; engineering is its identity.', knownFor: 'Aerospace, Nuclear, Materials' },
    { name: 'Physician-Scientist Program (BS/MD with Albany Medical College)', type: 'accelerated', prominence: 2, description: 'Seven-year accelerated route to an MD for entering freshmen.', knownFor: 'BS/MD' },
    { name: 'Games and Simulation Arts and Sciences', type: 'other', prominence: 2, description: 'A perennial top-10 game-design program blending art, code, and simulation.', knownFor: 'Game Design' },
  ],
  'Pepperdine University': [
    { name: 'International Programs', type: 'study-abroad', prominence: 1, description: 'Pepperdine\'s signature: among the highest study-abroad participation in the nation, with year-long residential campuses in Florence, London, Buenos Aires, and beyond.' },
    { name: 'Seaver College', type: 'constituent-school', prominence: 2, description: 'The undergraduate liberal-arts college on the Malibu bluffs, with strong business administration and communication divisions.', knownFor: 'Business, Communication' },
  ],
  'Santa Clara University': [
    { name: 'Leavey School of Business', type: 'constituent-school', prominence: 1, description: 'Top-tier Jesuit business school whose Silicon Valley location drives outstanding placement.', knownFor: 'Finance, Marketing' },
    { name: 'School of Engineering', type: 'constituent-school', prominence: 2, description: 'Small engineering school minutes from the world\'s largest tech employers.', knownFor: 'CS, Web Design & Engineering' },
    { name: 'Silicon Valley Internship Pipeline', type: 'other', prominence: 3, description: 'Location advantage: term-time internships at major tech firms are routine.' },
  ],
  'University of Miami': [
    { name: 'Rosenstiel School of Marine, Atmospheric, and Earth Science', type: 'constituent-school', prominence: 1, description: 'One of the world\'s leading marine-science schools, with its own island campus on Biscayne Bay.', knownFor: 'Marine Science, Atmospheric Science' },
    { name: 'Frost School of Music', type: 'constituent-school', prominence: 2, description: 'Innovative conservatory famous for music engineering and its jazz program.', knownFor: 'Music Engineering, Jazz' },
    { name: 'Miami Herbert Business School', type: 'constituent-school', prominence: 2, description: 'Strong business school positioned as the gateway to Latin American commerce.', knownFor: 'International Business, Finance' },
  ],
  'Northeastern University Oakland': [
    { name: 'Cooperative Education (Co-op) Program', type: 'co-op', prominence: 1, description: 'The defining Northeastern experience: most students complete two or three six-month paid co-ops before graduating.', },
    { name: 'Khoury College of Computer Sciences', type: 'constituent-school', prominence: 2, description: 'Fast-rising CS college known for combined "CS + X" majors and co-op-driven job outcomes.', knownFor: 'CS, Data Science' },
    { name: "D'Amore-McKim School of Business", type: 'constituent-school', prominence: 2, description: 'Business school whose co-op rotations translate into strong post-grad employment.', knownFor: 'Business, Entrepreneurship' },
  ],
  'Tulane University of Louisiana': [
    { name: 'A. B. Freeman School of Business', type: 'constituent-school', prominence: 2, description: 'Well-ranked business school with standout finance and energy-sector ties.', knownFor: 'Finance, Energy' },
    { name: 'Undergraduate Public Health', type: 'other', prominence: 2, description: 'One of the few top universities where undergraduates study in a dedicated school of public health and tropical medicine.', knownFor: 'Public Health' },
    { name: 'Public Service Requirement', type: 'other', prominence: 3, description: 'Tulane was the first major research university to require community service for graduation — service learning is core to its culture.' },
  ],
  'University of Maryland-College Park': [
    { name: 'Department of Computer Science', type: 'other', prominence: 1, description: 'Top-10 public CS program with deep cybersecurity and quantum-computing ties to nearby federal agencies.', knownFor: 'CS, Cybersecurity, Quantum' },
    { name: 'A. James Clark School of Engineering', type: 'constituent-school', prominence: 2, description: 'Top-25 engineering school near NASA Goddard and the federal research corridor.', knownFor: 'Aerospace, ECE' },
    { name: 'Robert H. Smith School of Business', type: 'constituent-school', prominence: 2, description: 'Analytics-heavy public business school inside the DC job market.', knownFor: 'Finance, Information Systems' },
  ],
  'Virginia Polytechnic Institute and State University': [
    { name: 'College of Engineering', type: 'constituent-school', prominence: 1, description: 'Virginia Tech\'s flagship — a top-15 public engineering college with a huge employer pipeline.', knownFor: 'Aerospace, Civil, CS' },
    { name: 'School of Architecture + Design', type: 'constituent-school', prominence: 2, description: 'Consistently ranked among the best undergraduate architecture programs in the country.', knownFor: 'Architecture, Industrial Design' },
    { name: 'Pamplin College of Business', type: 'constituent-school', prominence: 3, description: 'Large business school with a well-regarded hospitality program.' },
    { name: 'Corps of Cadets', type: 'other', prominence: 3, description: 'One of the few remaining full-time military corps at a public university, offering a distinct leadership track.' },
  ],
  'Syracuse University': [
    { name: 'S.I. Newhouse School of Public Communications', type: 'constituent-school', prominence: 1, description: 'The most famous name in communications education — the jewel of Syracuse.', knownFor: 'Broadcast Journalism, PR, Advertising' },
    { name: 'Maxwell School of Citizenship and Public Affairs', type: 'constituent-school', prominence: 2, description: 'The nation\'s #1-ranked school for public affairs, open to undergraduates through the citizenship curriculum.', knownFor: 'Policy Studies, International Relations' },
    { name: 'Whitman School of Management', type: 'constituent-school', prominence: 3, description: 'Solid business school with strong entrepreneurship offerings.' },
  ],
  'University of Connecticut': [
    { name: 'School of Business', type: 'constituent-school', prominence: 2, description: 'Well-ranked public business school feeding Hartford\'s insurance and finance industries.', knownFor: 'Finance, Risk Management' },
    { name: 'UConn Honors Program', type: 'honors-college', prominence: 2, description: 'Honors classes, housing, and research funding at New England\'s top public university.' },
    { name: 'Neag School of Education', type: 'constituent-school', prominence: 3, description: 'Top-ranked education school with an integrated five-year teacher-certification path.' },
  ],
  'University of Pittsburgh-Pittsburgh Campus': [
    { name: 'Guaranteed Admissions Programs', type: 'accelerated', prominence: 1, description: 'Freshman applicants can earn guaranteed future admission to Pitt\'s medical, dental, law, and other professional schools — a rare umbrella of direct-entry options.', knownFor: 'BS/MD, Pre-Professional' },
    { name: 'Swanson School of Engineering', type: 'constituent-school', prominence: 2, description: 'Strong engineering school with a first-year co-op-style industry exposure.', knownFor: 'Bioengineering, Industrial' },
    { name: 'David C. Frederick Honors College', type: 'honors-college', prominence: 2, description: 'Degree-granting honors college with research and fellowship advising.' },
  ],
  'Southern Methodist University': [
    { name: 'Cox School of Business', type: 'constituent-school', prominence: 1, description: 'SMU\'s flagship school, wired into the Dallas business establishment.', knownFor: 'Finance, Real Estate' },
    { name: 'Meadows School of the Arts', type: 'constituent-school', prominence: 2, description: 'Nationally recognized arts school spanning dance, theatre, film, and advertising.', knownFor: 'Dance, Advertising, Film' },
    { name: 'Lyle School of Engineering', type: 'constituent-school', prominence: 3, description: 'Small engineering school with strong corporate ties across the Metroplex.' },
  ],
  'George Washington University': [
    { name: 'Elliott School of International Affairs', type: 'constituent-school', prominence: 1, description: 'One of the top international-affairs schools in the world, blocks from the State Department and White House.', knownFor: 'International Affairs, Security Policy' },
    { name: 'School of Media & Public Affairs', type: 'constituent-school', prominence: 2, description: 'Political communication and journalism taught at the center of American politics.', knownFor: 'Political Communication, Journalism' },
    { name: 'Washington Internship Culture', type: 'other', prominence: 3, description: 'Semester internships on the Hill, in agencies, and at NGOs are effectively part of the curriculum.' },
  ],
  'Clemson University': [
    { name: 'College of Engineering, Computing and Applied Sciences', type: 'constituent-school', prominence: 1, description: 'Clemson\'s flagship college; automotive engineering research (CU-ICAR) is nationally distinctive.', knownFor: 'Automotive, Civil, CS' },
    { name: 'Calhoun Honors College', type: 'honors-college', prominence: 2, description: 'Selective honors college with dedicated housing and research grants.' },
    { name: 'Wilbur O. and Ann Powers College of Business', type: 'constituent-school', prominence: 3, description: 'Growing business college in a new state-of-the-art building.' },
  ],
  'Worcester Polytechnic Institute': [
    { name: 'Project-Based Curriculum (IQP & MQP)', type: 'other', prominence: 1, description: 'WPI\'s defining feature: every student completes two major real-world projects, one usually abroad, instead of a purely exam-based degree.' },
    { name: 'Global Projects Program', type: 'study-abroad', prominence: 2, description: 'More than 50 project centers worldwide where students solve problems for real sponsors.' },
    { name: 'Robotics Engineering', type: 'other', prominence: 2, description: 'WPI launched the nation\'s first BS in robotics engineering and remains a leader.', knownFor: 'Robotics' },
  ],
  'University of Minnesota-Duluth': [
    { name: 'Labovitz School of Business and Economics', type: 'constituent-school', prominence: 2, description: 'AACSB-accredited business school serving the Twin Ports region.', knownFor: 'Accounting, Marketing' },
    { name: 'Swenson College of Science and Engineering', type: 'constituent-school', prominence: 2, description: 'Hands-on engineering and science programs with strong regional job placement.', knownFor: 'Engineering, CS' },
    { name: 'Large Lakes Observatory', type: 'research', prominence: 3, description: 'The only US institute dedicated to studying large lakes worldwide — unique freshwater research on Lake Superior.' },
  ],
  'North Carolina State University at Raleigh': [
    { name: 'College of Engineering', type: 'constituent-school', prominence: 1, description: 'Top-tier public engineering college anchoring Research Triangle Park\'s talent supply.', knownFor: 'Nuclear, Materials, CS' },
    { name: 'Wilson College of Textiles', type: 'constituent-school', prominence: 2, description: 'The premier textiles college in the country — essentially one of a kind.', knownFor: 'Textile Engineering, Fashion Development' },
    { name: 'College of Design', type: 'constituent-school', prominence: 2, description: 'Highly ranked design college spanning architecture, graphic, and industrial design.', knownFor: 'Architecture, Industrial Design' },
  ],
  'Brigham Young University': [
    { name: 'Marriott School of Business', type: 'constituent-school', prominence: 1, description: 'BYU\'s jewel — accounting and entrepreneurship rank among the nation\'s best, with famously strong recruiting.', knownFor: 'Accounting, Entrepreneurship' },
    { name: 'BYU Animation', type: 'other', prominence: 2, description: 'Perennial top-ranked animation program whose student films feed Pixar and DreamWorks pipelines.', knownFor: 'Animation' },
    { name: 'Language Programs', type: 'other', prominence: 3, description: 'Uncommon depth in languages — a majority of students speak a second language, and 60+ are taught.' },
  ],
  'Stevens Institute of Technology': [
    { name: 'Schaefer School of Engineering and Science', type: 'constituent-school', prominence: 1, description: 'Stevens\' core: engineering with a design-spine curriculum and Manhattan-skyline proximity to industry.', knownFor: 'Mechanical, Software Engineering' },
    { name: 'Cooperative Education Program', type: 'co-op', prominence: 2, description: 'Optional five-year co-op alternating semesters of paid work in the New York metro market.' },
    { name: 'Quantitative Finance Program', type: 'other', prominence: 2, description: 'A distinctive undergraduate quant-finance degree placing graduates on Wall Street trading desks.', knownFor: 'Quantitative Finance' },
  ],
  'University of California-Santa Cruz': [
    { name: 'Genomics Institute', type: 'research', prominence: 1, description: 'UCSC scientists assembled the first public human genome sequence; genomics research is open to undergraduates.', knownFor: 'Genomics, Bioinformatics' },
    { name: 'Baskin School of Engineering', type: 'constituent-school', prominence: 2, description: 'Home to strong CS, games, and bioinformatics programs.', knownFor: 'CS, Computer Game Design' },
    { name: 'Astronomy & Astrophysics', type: 'research', prominence: 2, description: 'UCSC manages Lick Observatory and ranks among the world\'s most influential astrophysics programs.', knownFor: 'Astrophysics' },
  ],
  'University of Iowa': [
    { name: 'English & Creative Writing', type: 'other', prominence: 1, description: 'The undergraduate face of the Iowa Writers\' Workshop legacy — Iowa City is a UNESCO City of Literature and the most storied writing address in America.', knownFor: 'Creative Writing' },
    { name: 'Tippie College of Business', type: 'constituent-school', prominence: 2, description: 'Well-ranked public business school known for marketing and finance.', knownFor: 'Marketing, Finance' },
    { name: 'College of Nursing', type: 'constituent-school', prominence: 3, description: 'Top-ranked BSN adjacent to a major university hospital system.' },
  ],
  'Michigan State University': [
    { name: 'Broad College of Business', type: 'constituent-school', prominence: 1, description: 'Home of the #1-ranked supply chain management program in the country.', knownFor: 'Supply Chain Management' },
    { name: 'James Madison College', type: 'constituent-school', prominence: 2, description: 'A selective residential college for public affairs and international relations.', knownFor: 'International Relations, Political Theory' },
    { name: 'Lyman Briggs College', type: 'constituent-school', prominence: 2, description: 'Residential science college blending lab science with its history and philosophy.' },
    { name: 'College of Education', type: 'constituent-school', prominence: 3, description: 'Long-running #1 rankings in elementary and secondary education programs.' },
  ],
  'University of Delaware': [
    { name: 'Chemical Engineering (College of Engineering)', type: 'constituent-school', prominence: 1, description: 'UD chemical engineering is historically among the very best anywhere, with DuPont-rooted industry ties.', knownFor: 'Chemical Engineering' },
    { name: 'Study Abroad (First in the Nation)', type: 'study-abroad', prominence: 2, description: 'UD invented American study abroad in 1923 and still runs 100+ faculty-led programs.' },
    { name: 'Lerner College of Business and Economics', type: 'constituent-school', prominence: 3, description: 'Solid business college with a student-managed investment fund and hotel program.' },
  ],
  'American University': [
    { name: 'School of International Service', type: 'constituent-school', prominence: 1, description: 'One of the largest and most respected international-affairs schools in the world.', knownFor: 'International Studies' },
    { name: 'School of Public Affairs', type: 'constituent-school', prominence: 2, description: 'Top-ranked political science and policy school with unbeatable DC access.', knownFor: 'Political Science, Justice' },
    { name: 'Kogod School of Business', type: 'constituent-school', prominence: 3, description: 'Business school specializing in the intersection of business and government.' },
  ],
  'Baylor University': [
    { name: 'Hankamer School of Business', type: 'constituent-school', prominence: 2, description: 'Well-ranked Christian business school; the Baylor Business Fellows honors track is notably rigorous.', knownFor: 'Entrepreneurship, Accounting' },
    { name: 'Louise Herrington School of Nursing', type: 'constituent-school', prominence: 2, description: 'Direct-entry BSN program based in Dallas\' hospital district.', knownFor: 'Nursing' },
    { name: 'University Scholars Program', type: 'honors-college', prominence: 3, description: 'Baylor\'s most flexible honors degree — students design their own curriculum with a thesis.' },
  ],
  'Fordham University': [
    { name: 'Gabelli School of Business', type: 'constituent-school', prominence: 1, description: 'Strong finance school with a direct pipeline to Wall Street from both campuses.', knownFor: 'Finance, Global Business' },
    { name: 'Fordham College at Lincoln Center', type: 'constituent-school', prominence: 2, description: 'Manhattan campus with acclaimed theatre and dance programs (including the Ailey/Fordham BFA).', knownFor: 'Theatre, Dance' },
    { name: 'Fordham London Centre', type: 'study-abroad', prominence: 3, description: 'Fordham\'s own London campus for semester programs in business and liberal arts.' },
  ],
  'Yeshiva University': [
    { name: 'Sy Syms School of Business', type: 'constituent-school', prominence: 2, description: 'Business school with strong accounting and finance placement in New York.', knownFor: 'Accounting, Finance' },
    { name: 'Dual Curriculum (Torah Umadda)', type: 'other', prominence: 2, description: 'The defining YU experience: rigorous Jewish studies alongside a full secular degree.' },
  ],
  'University of Colorado Boulder': [
    { name: 'Ann and H.J. Smead Aerospace Engineering Sciences', type: 'constituent-school', prominence: 1, description: 'Top-ranked aerospace program in a state dense with space industry; CU has flown instruments on missions to every planet.', knownFor: 'Aerospace Engineering' },
    { name: 'College of Engineering and Applied Science', type: 'constituent-school', prominence: 2, description: 'Strong public engineering college with quantum and climate research strengths.', knownFor: 'CS, Environmental Engineering' },
    { name: 'Leeds School of Business', type: 'constituent-school', prominence: 3, description: 'Solid business school with a strong entrepreneurship ecosystem.' },
  ],
  'Oregon State University': [
    { name: 'College of Forestry', type: 'constituent-school', prominence: 1, description: 'One of the world\'s top forestry programs, with its own 15,000-acre research forests.', knownFor: 'Forestry, Natural Resources' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 2, description: 'Large engineering college with standout nuclear and robotics research.', knownFor: 'Nuclear Engineering, Robotics' },
    { name: 'Oceanography & Marine Sciences', type: 'research', prominence: 2, description: 'A powerhouse in ocean and climate science with the Hatfield Marine Science Center on the coast.', knownFor: 'Oceanography' },
  ],
  'Indiana University-Bloomington': [
    { name: 'Kelley School of Business', type: 'constituent-school', prominence: 1, description: 'Top-10 undergraduate business school with a famously effective career machine.', knownFor: 'Finance, Marketing, Accounting', sourceUrl: 'https://kelley.iu.edu/' },
    { name: 'Jacobs School of Music', type: 'constituent-school', prominence: 1, description: 'One of the largest and most prestigious music schools in the world.', knownFor: 'Opera, Music Performance' },
    { name: 'Luddy School of Informatics, Computing, and Engineering', type: 'constituent-school', prominence: 2, description: 'Pioneering informatics school with strong CS and data science programs.', knownFor: 'Informatics, CS' },
  ],
  'Marquette University': [
    { name: 'College of Nursing', type: 'constituent-school', prominence: 2, description: 'Direct-admit BSN program with strong Milwaukee clinical placements.', knownFor: 'Nursing' },
    { name: 'Accelerated Physical Therapy (6-year DPT)', type: 'accelerated', prominence: 2, description: 'Direct-entry path from freshman year to a Doctor of Physical Therapy at a top PT school.', knownFor: 'Physical Therapy' },
    { name: 'College of Business Administration', type: 'constituent-school', prominence: 3, description: 'Jesuit business school with well-regarded finance and real estate programs.' },
  ],
  'Temple University': [
    { name: 'Fox School of Business', type: 'constituent-school', prominence: 1, description: 'Temple\'s flagship — its risk management & insurance program is perennially ranked #1 or #2 nationally.', knownFor: 'Risk Management & Insurance, Accounting' },
    { name: 'Klein College of Media and Communication', type: 'constituent-school', prominence: 2, description: 'One of the largest, most comprehensive media schools in the country.', knownFor: 'Journalism, Media Studies' },
    { name: 'Tyler School of Art and Architecture', type: 'constituent-school', prominence: 2, description: 'Nationally ranked art school within a major public research university.', knownFor: 'Fine Arts, Architecture' },
  ],
  'University of San Francisco': [
    { name: 'School of Nursing and Health Professions', type: 'constituent-school', prominence: 2, description: 'Direct-entry BSN in a city with world-class hospital systems.', knownFor: 'Nursing' },
    { name: 'San Francisco Location Advantage', type: 'other', prominence: 3, description: 'Internships across tech, biotech, and finance are a Muni ride away.' },
  ],
  'Howard University': [
    { name: 'Cathy Hughes School of Communications', type: 'constituent-school', prominence: 1, description: 'The flagship communications school of the nation\'s leading HBCU, with an exceptional media alumni network.', knownFor: 'Journalism, Film, Broadcasting' },
    { name: 'School of Business', type: 'constituent-school', prominence: 2, description: 'A premier pipeline of Black executives into Fortune 500 leadership and Wall Street.', knownFor: 'Finance, Accounting' },
    { name: 'BS/MD Accelerated Program', type: 'accelerated', prominence: 2, description: 'Six-year combined path to Howard\'s College of Medicine.', knownFor: 'BS/MD' },
  ],
  'University of South Carolina-Columbia': [
    { name: 'Darla Moore School of Business', type: 'constituent-school', prominence: 1, description: 'Home of the #1-ranked international business program in the country for two decades running.', knownFor: 'International Business, Supply Chain', sourceUrl: 'https://sc.edu/study/colleges_schools/moore/' },
    { name: 'South Carolina Honors College', type: 'honors-college', prominence: 1, description: 'Widely regarded as the best public honors college in America.' },
    { name: 'College of Hospitality, Retail and Sport Management', type: 'constituent-school', prominence: 3, description: 'Strong sport and entertainment management program.' },
  ],
  'Auburn University': [
    { name: 'Samuel Ginn College of Engineering', type: 'constituent-school', prominence: 1, description: 'Auburn\'s flagship college, with strong aerospace and a long NASA astronaut lineage.', knownFor: 'Aerospace, Mechanical' },
    { name: 'Professional Flight / Aviation Program', type: 'other', prominence: 2, description: 'One of the oldest university flight programs in the nation, with its own airport.', knownFor: 'Professional Flight' },
    { name: 'Harbert College of Business', type: 'constituent-school', prominence: 3, description: 'Well-regarded business school known for supply chain management.' },
  ],
  'University of Utah': [
    { name: 'Entertainment Arts & Engineering (Games)', type: 'other', prominence: 1, description: 'Consistently ranked the #1 or #2 video-game design program in the world.', knownFor: 'Game Design, Game Engineering' },
    { name: 'David Eccles School of Business', type: 'constituent-school', prominence: 2, description: 'Business school known for entrepreneurship in the "Silicon Slopes" tech corridor.', knownFor: 'Entrepreneurship, Finance' },
    { name: 'College of Engineering', type: 'constituent-school', prominence: 3, description: 'Strong engineering college — Utah\'s computer graphics lineage (Pixar co-founder, Adobe founder) is legendary.' },
  ],
  'University of Arizona': [
    { name: 'Astronomy & Wyant College of Optical Sciences', type: 'constituent-school', prominence: 1, description: 'World capital of optics and astronomy — UArizona builds NASA space telescopes and led the OSIRIS-REx asteroid mission.', knownFor: 'Astronomy, Optical Sciences' },
    { name: 'Eller College of Management', type: 'constituent-school', prominence: 2, description: 'Business school with a top-5 management information systems program.', knownFor: 'MIS, Entrepreneurship' },
    { name: 'W.A. Franke Honors College', type: 'honors-college', prominence: 3, description: 'Large honors college with dedicated housing village and research funding.' },
  ],
  'University of Massachusetts-Amherst': [
    { name: 'Isenberg School of Management', type: 'constituent-school', prominence: 1, description: 'Top-ranked public business school in the Northeast; sport management is nationally elite.', knownFor: 'Sport Management, Finance' },
    { name: 'Manning College of Information and Computer Sciences', type: 'constituent-school', prominence: 2, description: 'A top-20 CS program that has risen fast, with strengths in AI and NLP.', knownFor: 'CS, AI' },
    { name: 'Commonwealth Honors College', type: 'honors-college', prominence: 2, description: 'Residential honors college with its own campus-within-a-campus.' },
  ],
  'Drexel University': [
    { name: 'Drexel Co-op', type: 'co-op', prominence: 1, description: 'The signature Drexel experience: up to three six-month paid co-ops woven into a five-year degree.' },
    { name: 'BS/MD Early Assurance Program', type: 'accelerated', prominence: 2, description: 'Accelerated combined-degree route to Drexel\'s College of Medicine.', knownFor: 'BS/MD' },
    { name: 'Westphal College of Media Arts & Design', type: 'constituent-school', prominence: 2, description: 'Strong design school — game design, animation, and fashion regularly rank nationally.', knownFor: 'Game Design, Animation, Fashion' },
  ],
  'Arizona State University Campus Immersion': [
    { name: 'Barrett, The Honors College', type: 'honors-college', prominence: 1, description: 'The gold standard of American honors colleges — a selective residential college inside ASU with its own faculty.', sourceUrl: 'https://barretthonors.asu.edu/' },
    { name: 'Walter Cronkite School of Journalism', type: 'constituent-school', prominence: 1, description: 'One of the nation\'s premier journalism schools, with a working newsroom in downtown Phoenix.', knownFor: 'Broadcast Journalism, Sports Journalism', sourceUrl: 'https://cronkite.asu.edu/' },
    { name: 'W. P. Carey School of Business', type: 'constituent-school', prominence: 2, description: 'Huge, well-ranked business school with top-5 supply chain and MIS programs.', knownFor: 'Supply Chain, MIS' },
    { name: 'Ira A. Fulton Schools of Engineering', type: 'constituent-school', prominence: 2, description: 'The largest engineering school in the country, with every specialty imaginable.', knownFor: 'CS, Robotics, Aerospace' },
  ],
  'Saint Louis University': [
    { name: 'Medical Scholars Program', type: 'accelerated', prominence: 2, description: 'Provisional early acceptance to SLU\'s School of Medicine for strong entering freshmen.', knownFor: 'Pre-Med, BS/MD track' },
    { name: 'Parks College of Engineering, Aviation and Technology', type: 'constituent-school', prominence: 2, description: 'Home of America\'s first federally certified flight school; aviation science remains a signature.', knownFor: 'Aviation, Aerospace Engineering' },
    { name: 'SLU-Madrid Campus', type: 'study-abroad', prominence: 2, description: 'SLU\'s own degree-granting campus in Madrid — start, visit, or finish your degree in Spain.' },
  ],
  'Loyola University Chicago': [
    { name: 'Marcella Niehoff School of Nursing', type: 'constituent-school', prominence: 2, description: 'Direct-admit BSN with clinical placements across Chicago\'s hospital systems.', knownFor: 'Nursing' },
    { name: 'John Felice Rome Center', type: 'study-abroad', prominence: 2, description: 'Loyola\'s own Rome campus, one of the oldest American campuses in Italy.' },
    { name: 'Quinlan School of Business', type: 'constituent-school', prominence: 3, description: 'Jesuit business school in the heart of downtown Chicago.' },
  ],
  'University of Kentucky': [
    { name: 'Lewis Honors College', type: 'honors-college', prominence: 2, description: 'Honors college with dedicated residence halls and personalized advising.' },
    { name: 'Equine Science & Management', type: 'other', prominence: 2, description: 'Signature program in the horse capital of the world, with Keeneland and major farms as classrooms.', knownFor: 'Equine Science' },
    { name: 'Gatton College of Business and Economics', type: 'constituent-school', prominence: 3, description: 'Solid business school with a strong accounting program.' },
  ],
  'The University of Tennessee-Knoxville': [
    { name: 'Haslam College of Business', type: 'constituent-school', prominence: 1, description: 'UT\'s flagship — supply chain management ranks in the national top three.', knownFor: 'Supply Chain Management' },
    { name: 'Tickle College of Engineering', type: 'constituent-school', prominence: 2, description: 'Strong engineering college with unique access to Oak Ridge National Laboratory.', knownFor: 'Nuclear Engineering, Materials' },
    { name: 'Howard H. Baker Jr. School of Public Policy and Public Affairs', type: 'constituent-school', prominence: 3, description: 'New public-policy school built on the Baker Center\'s bipartisan legacy.' },
  ],
  'University of Oklahoma-Health Sciences Center': [
    { name: 'School of Meteorology', type: 'constituent-school', prominence: 1, description: 'The largest meteorology program in the nation, co-located with the National Weather Center — the place to study severe weather.', knownFor: 'Meteorology' },
    { name: 'Gaylord College of Journalism and Mass Communication', type: 'constituent-school', prominence: 2, description: 'Well-regarded journalism school with strong broadcast facilities.', knownFor: 'Journalism' },
    { name: 'Price College of Business', type: 'constituent-school', prominence: 3, description: 'Business school with a nationally ranked energy management program.', knownFor: 'Energy Management' },
  ],
  'University of Nebraska-Lincoln': [
    { name: 'Jeffrey S. Raikes School of Computer Science and Management', type: 'honors-college', prominence: 1, description: 'An ultra-selective honors program blending CS and business, backed by the Microsoft co-architect it\'s named for.', knownFor: 'CS, Business' },
    { name: 'Actuarial Science Program', type: 'other', prominence: 2, description: 'One of the strongest actuarial programs in the country, recognized as a Center of Actuarial Excellence.', knownFor: 'Actuarial Science' },
    { name: 'Johnny Carson School of Theatre and Film', type: 'constituent-school', prominence: 2, description: 'Emerging-media and film school boosted by a landmark Carson family gift.', knownFor: 'Emerging Media Arts, Film' },
  ],
};

async function main() {
  console.log('S1: Seeding CollegeProgram entries for the top 100 colleges...');

  let collegesSeeded = 0;
  let programsCreated = 0;
  const missing: string[] = [];

  for (const [collegeName, seeds] of Object.entries(PROGRAMS)) {
    const colleges = await prisma.college.findMany({
      where: { name: collegeName },
      select: { id: true, name: true, website: true, ranking: true },
    });

    if (colleges.length === 0) {
      missing.push(collegeName);
      continue;
    }

    // A few names appear more than once (e.g. Stony Brook at #29 and #81); seed each row.
    for (const college of colleges) {
      await prisma.collegeProgram.deleteMany({ where: { collegeId: college.id } });
      await prisma.collegeProgram.createMany({
        data: seeds.map((s) => ({
          collegeId: college.id,
          name: s.name,
          type: s.type,
          prominence: s.prominence,
          description: s.description,
          knownFor: s.knownFor ?? null,
          sourceUrl: s.sourceUrl ?? college.website ?? null,
        })),
      });
      collegesSeeded++;
      programsCreated += seeds.length;
    }
  }

  console.log(`Seeded ${programsCreated} programs across ${collegesSeeded} college rows.`);
  if (missing.length) {
    console.warn('No college row matched these names:', missing);
  }

  // Acceptance check: every top-100 college should now have >= 1 program.
  const top100 = await prisma.college.findMany({
    where: { ranking: { lte: 100 } },
    select: { name: true, ranking: true, _count: { select: { programs: true } } },
  });
  const uncovered = top100.filter((c) => c._count.programs === 0);
  if (uncovered.length) {
    console.warn('Top-100 colleges WITHOUT programs:', uncovered.map((c) => `${c.ranking}. ${c.name}`));
  } else {
    console.log(`All ${top100.length} top-100 college rows have at least one program.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());

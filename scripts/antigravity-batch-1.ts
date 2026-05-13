import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const data = [
  {
    name: "Emory University",
    studentLifeSnippet: "Emory boasts a deeply engaged student body with a strong emphasis on Greek life, pre-professional tracks, and community service. The campus culture strikes a balance between rigorous academics and an active social scene centered around Atlanta.",
    athleticsSnippet: "While Emory competes in Division III, intramural sports and club teams are wildly popular. The campus rallies around the Emory Eagles, but the athletics culture is more participatory than spectator-focused.",
    safetySnippet: "Located in the affluent Druid Hills neighborhood of Atlanta, Emory's campus is considered extremely safe. The university maintains a robust police department and numerous safety programs for students."
  },
  {
    name: "Georgetown University",
    studentLifeSnippet: "Georgetown's culture is heavily influenced by its Catholic and Jesuit heritage, fostering a commitment to social justice and global awareness. The vibrant social scene is dominated by student-run clubs, political organizations, and the historic charm of the surrounding neighborhood.",
    athleticsSnippet: "Georgetown is a powerhouse in Big East basketball, and Hoyas basketball games at the Capital One Arena are central to campus spirit. Beyond varsity sports, club sailing and rugby have deeply ingrained traditions.",
    safetySnippet: "The Georgetown neighborhood is one of Washington D.C.'s safest and most upscale areas. The university employs extensive campus police and a neighborhood shuttle system to ensure student security."
  },
  {
    name: "University of Virginia-Main Campus",
    studentLifeSnippet: "UVA blends historic Southern charm with a highly rigorous academic environment and a massive Greek life presence. Secret societies and time-honored traditions heavily influence the lively and deeply loyal student culture.",
    athleticsSnippet: "UVA is an ACC powerhouse, with highly competitive basketball, baseball, and lacrosse programs that dominate student life. 'Wahoos' exhibit fierce school pride, making game days massive campus-wide events.",
    safetySnippet: "Charlottesville is generally considered a safe, quintessential college town. The university relies on the UVA Police Department and the ambassador program to patrol the Grounds and nearby off-campus areas."
  },
  {
    name: "Carnegie Mellon University",
    studentLifeSnippet: "CMU is renowned for its intense, collaborative, and quirky intellectual atmosphere where computer science and the arts beautifully collide. Traditions like 'The Fence' painting and Buggy races highlight a uniquely geek-chic campus culture.",
    athleticsSnippet: "Athletics take a back seat to academics and creative projects at this Division III school. However, club sports and intramurals are popular stress-relievers for the highly driven student body.",
    safetySnippet: "Situated in the Oakland neighborhood of Pittsburgh, CMU shares a bustling, student-heavy area with the University of Pittsburgh. It is generally very safe, supported by proactive campus police and escort services."
  },
  {
    name: "University of North Carolina at Chapel Hill",
    studentLifeSnippet: "UNC Chapel Hill offers the quintessential big-state-school experience, defined by a gorgeous historic campus, strong Greek life, and deep-rooted traditions. It maintains a highly collaborative, progressive, and wildly spirited student atmosphere.",
    athleticsSnippet: "Tar Heel basketball is akin to a religion in Chapel Hill, defining the campus's social heartbeat during the winter and spring. The rivalry with Duke is legendary, leading to massive celebrations on Franklin Street after big wins.",
    safetySnippet: "Chapel Hill is widely regarded as one of the best and safest college towns in America. The university provides extensive safety resources, including late-night transit and a highly visible campus police presence."
  },
  {
    name: "Wake Forest University",
    studentLifeSnippet: "Often described as 'Work Forest,' the university balances highly demanding academics with a vibrant, tight-knit, and heavily Greek-dominated social scene. The small undergraduate population fosters a very intimate, community-driven campus feel.",
    athleticsSnippet: "As the smallest school in the Power 5 conferences, Wake Forest punches above its weight in the ACC, particularly in golf, tennis, and soccer. Demon Deacon tailgates and games are central pillars of fall campus life.",
    safetySnippet: "Located in a quiet, affluent residential area of Winston-Salem, the campus feels like a secure, enclosed park. Crime rates are remarkably low, and campus security is highly responsive."
  },
  {
    name: "Stony Brook University",
    studentLifeSnippet: "Stony Brook has a heavily STEM-focused, diverse, and commuter-heavy student body, though campus life has grown increasingly vibrant. Students bond over challenging academics, research opportunities, and weekend trips into New York City.",
    athleticsSnippet: "The Seawolves compete in Division I, with football and basketball games drawing solid student crowds. However, the athletics culture is growing rather than dominant, with many students preferring intramurals.",
    safetySnippet: "Situated on the North Shore of Long Island, Stony Brook boasts one of the lowest crime rates of any major public university in New York. The campus is well-patrolled and feels incredibly secure."
  },
  {
    name: "University of Florida",
    studentLifeSnippet: "UF offers a massive, sun-soaked state school environment with an incredibly spirited and outgoing student body. Greek life, extensive clubs, and outdoor activities dictate the vibrant social rhythm of Gainesville.",
    athleticsSnippet: "Gator Nation is a Division I powerhouse, and SEC football dictates the entire culture of the university every fall. Game days at 'The Swamp' are legendary, drawing tens of thousands of fans and creating an electric atmosphere.",
    safetySnippet: "Gainesville is a bustling college town, and while typical minor property crimes occur, the campus itself is heavily monitored. UF operates a large police department and provides the SNAP nighttime escort service."
  },
  {
    name: "University of Southern California",
    studentLifeSnippet: "USC is famous for its 'work hard, play hard' mentality, combining elite academics with an incredibly robust Greek system and a powerful alumni network. The sunny Los Angeles campus is energetic, entrepreneurial, and heavily social.",
    athleticsSnippet: "Trojan football is historically legendary and forms the absolute core of USC's school spirit. Tailgating on campus before games at the LA Coliseum is a mandatory and massive student tradition.",
    safetySnippet: "Located in South Central Los Angeles, the area surrounding USC has historically high urban crime rates. However, the university surrounds the campus with an intense 'security perimeter' featuring 24/7 yellow-jacket ambassadors and strict nighttime access."
  },
  {
    name: "Tufts University",
    studentLifeSnippet: "Tufts students are known for being quirky, highly intellectual, and deeply engaged in international relations and social activism. The campus balances the intimacy of a liberal arts college with the resources of a research university.",
    athleticsSnippet: "Operating in Division III, the NESCAC athletics scene at Tufts is low-pressure but passionately supported by a tight-knit community. Club and intramural sports are very popular as healthy creative outlets.",
    safetySnippet: "Straddling the affluent suburbs of Medford and Somerville, the Tufts campus is considered exceptionally safe. It offers a quiet residential feel while being just a short T-ride away from downtown Boston."
  },
  {
    name: "University of California-San Diego",
    studentLifeSnippet: "UCSD is renowned for its intense STEM focus, gorgeous coastal location, and unique 'six colleges' residential system. The social vibe is famously laid-back and quiet, often jokingly referred to as 'UC Socially Dead,' though beach culture thrives.",
    athleticsSnippet: "UCSD recently transitioned to Division I, but it lacks a football team and the massive sports culture of other UC schools. Surfing, club sports, and recreational fitness are far more prominent.",
    safetySnippet: "Located in La Jolla, one of San Diego's wealthiest and safest coastal neighborhoods, the campus is incredibly secure. Crime is remarkably rare, making it one of the safest UCs."
  },
  {
    name: "University of California-Davis",
    studentLifeSnippet: "Davis offers a collaborative, friendly, and deeply environmentally-conscious campus culture. Known as the bicycle capital of the US, the student body is heavily involved in agriculture, veterinary sciences, and sustainable living.",
    athleticsSnippet: "While UC Davis competes in Division I FCS, the athletics culture is moderate, with the 'Aggies' football and basketball teams enjoying strong local support. Intramural sports and outdoor recreation dominate student activity.",
    safetySnippet: "Davis is the quintessential peaceful college town, known for its extremely low crime rates and friendly locals. The biggest safety concern on campus is bicycle theft rather than personal safety."
  },
  {
    name: "The University of Texas at Austin",
    studentLifeSnippet: "UT Austin is a massive, energetic institution located in the heart of the 'Live Music Capital of the World.' The culture is a mix of intense school pride, massive Greek life, and the progressive, artsy vibe of Austin.",
    athleticsSnippet: "Texas Longhorns football is a cultural phenomenon that essentially shuts down the city of Austin on game days. The athletics culture is immense, wealthy, and deeply ingrained in the student identity.",
    safetySnippet: "Austin is generally a safe city, but the areas immediately surrounding campus (like West Campus) can experience urban property crime. UT employs a massive police force and provides comprehensive night-ride services."
  },
  {
    name: "University of Wisconsin-Madison",
    studentLifeSnippet: "UW Madison perfectly balances elite academics with a legendary 'work hard, play hard' Midwestern culture. The social scene is dominated by a vibrant State Street, strong Greek life, and a deeply passionate student body.",
    athleticsSnippet: "Badger game days are iconic, completely transforming the campus into a sea of red as students 'Jump Around' at Camp Randall Stadium. It is widely considered one of the best college sports atmospheres in America.",
    safetySnippet: "Madison is repeatedly ranked as one of the best and safest college towns in the US. While students must be mindful of typical downtown nightlife issues, the campus and surrounding lakes feel extremely secure."
  },
  {
    name: "University of Illinois Urbana-Champaign",
    studentLifeSnippet: "UIUC features a massive, highly-ranked Greek system and a deeply collaborative, STEM-heavy academic environment. The dual-city campus creates a bustling micro-metropolis entirely dedicated to student life.",
    athleticsSnippet: "Competing in the Big Ten, Fighting Illini basketball and football draw massive, spirited crowds. Game days and tailgating are central to the fall and winter social calendars.",
    safetySnippet: "Urbana-Champaign is a classic, isolated college town that is generally very safe. The university maintains excellent lighting, a highly responsive police force, and safe-walk programs for students."
  },
  {
    name: "William & Mary",
    studentLifeSnippet: "Known for its 'Twamp' (Typical William & Mary Person) culture, students here are quirky, hyper-intellectual, and deeply stressed about academics. The historic campus fosters a tight-knit, collaborative, and slightly nerdy community.",
    athleticsSnippet: "Athletics take a back seat to academics, though the Division I Tribe teams have a loyal following. Intramurals, club sports, and historic campus traditions form the bulk of student activity.",
    safetySnippet: "Located in Colonial Williamsburg, the area is an incredibly safe, quiet, and heavily tourist-policed historic district. Crime on the picturesque campus is almost non-existent."
  },
  {
    name: "Georgia Institute of Technology-Main Campus",
    studentLifeSnippet: "Georgia Tech is infamous for its grueling academic rigor, creating a culture built on mutual survival and intense collaboration. The urban campus in Midtown Atlanta is heavily driven by engineering, tech innovation, and strong Greek life.",
    athleticsSnippet: "The Yellow Jackets compete in the ACC, and despite the heavy academic load, students show up fiercely for football and basketball. The rivalry with the University of Georgia is one of the most intense in the South.",
    safetySnippet: "Situated in the heart of Atlanta, the campus faces typical urban security challenges. However, the university operates one of the most proactive and well-funded campus police departments in the country, maintaining a very safe perimeter."
  },
  {
    name: "Case Western Reserve University",
    studentLifeSnippet: "Case Western boasts a highly focused, research-driven, and collaborative student body with a heavy pre-med and engineering lean. The culture is notoriously nerdy and hardworking, but students frequent the surrounding museums and cultural institutions.",
    athleticsSnippet: "Operating in Division III, CWRU's athletics scene is very low-key, with academics always taking precedence. Club sports, gaming, and intramurals are much more popular than varsity sporting events.",
    safetySnippet: "Located in University Circle, the cultural hub of Cleveland, the immediate area is heavily policed and safe. Students are advised to be street-smart when venturing into surrounding neighborhoods off-campus."
  },
  {
    name: "Boston University",
    studentLifeSnippet: "BU does not have a traditional enclosed campus; instead, it spans a massive stretch of Commonwealth Avenue, fully integrating students into the fast-paced Boston lifestyle. The vibe is highly independent, diverse, and pre-professional.",
    athleticsSnippet: "BU notoriously does not have a football team, but Terriers ice hockey is a massive deal, drawing passionate crowds. The Beanpot tournament is the absolute pinnacle of the university's athletic and social calendar.",
    safetySnippet: "Boston is generally one of the safer major US cities, and the BU campus area is heavily populated and well-lit. BU maintains a massive police presence and emergency call boxes along the entire urban corridor."
  },
  {
    name: "Ohio State University Agricultural Technical Institute",
    studentLifeSnippet: "As a smaller regional campus of OSU, the Agricultural Technical Institute offers a deeply hands-on, rural, and tight-knit community focused entirely on agricultural and environmental sciences.",
    athleticsSnippet: "While the campus itself lacks massive varsity sports, students are deeply connected to the massive Buckeye football culture down in Columbus. Local intramurals and outdoor recreation dominate the campus vibe.",
    safetySnippet: "Located in Wooster, Ohio, the campus is situated in a quiet, rural, and highly secure agricultural area. Crime is exceedingly rare, and the environment is very peaceful."
  },
  {
    name: "Purdue University-Main Campus",
    studentLifeSnippet: "Purdue is renowned for its intense engineering programs and a deeply spirited, down-to-earth Midwestern student body. 'Boilermaker' culture revolves around a strong work ethic, massive Greek life, and the iconic Grand Prix go-kart race.",
    athleticsSnippet: "Purdue basketball is the heart and soul of the campus, with Mackey Arena renowned as one of the loudest venues in college sports. Big Ten football also draws massive, dedicated crowds to Ross-Ade Stadium.",
    safetySnippet: "West Lafayette is a prototypical, sleepy college town that exists entirely to support the university. It is widely considered extremely safe, with a highly visible police force and community-focused security."
  },
  {
    name: "University of Rochester",
    studentLifeSnippet: "UR fosters a uniquely flexible and intensely intellectual culture due to its open curriculum, allowing students to heavily customize their degrees. The atmosphere is collaborative, slightly quirky, and heavily focused on research and music.",
    athleticsSnippet: "Competing in Division III, athletics are a very minor part of the social scene at Rochester. Instead, a cappella, theater, and intramural sports dominate the extracurricular landscape.",
    safetySnippet: "The River Campus is nestled in a bend of the Genesee River, creating a naturally secure and isolated environment. While some surrounding neighborhoods in Rochester require street smarts, the campus itself is heavily patrolled and safe."
  },
  {
    name: "Lehigh University",
    studentLifeSnippet: "Lehigh is famous for its 'work hard, play hard' culture, blending intense engineering and business curriculums with a massive, dominant Greek life presence. The student body is highly social, competitive, and tightly knit.",
    athleticsSnippet: "The Mountain Hawks compete in Division I, and the historic football rivalry with Lafayette College ('The Rivalry') is the centerpiece of the entire school year. It dictates the campus culture for weeks.",
    safetySnippet: "The campus is built into the side of a mountain, providing natural seclusion and a very safe immediate environment. While the surrounding town of Bethlehem has some rougher spots, the university provides excellent shuttle and security services."
  },
  {
    name: "Texas A&M University-College Station",
    studentLifeSnippet: "A&M boasts arguably the most intense, tradition-rich, and unified student culture in the country. The 'Aggie network' is legendary, characterized by extreme school pride, conservative values, and a massive Corps of Cadets.",
    athleticsSnippet: "SEC Football at Kyle Field is essentially a religion, and the student body stands for the entire game as the '12th Man.' Midnight Yell practice before game days is one of the most unique and massive traditions in college sports.",
    safetySnippet: "College Station is a massive, sprawling college town that revolves entirely around the university. It is considered exceptionally safe, heavily policed, and highly protective of its student population."
  },
  {
    name: "Boston College",
    studentLifeSnippet: "BC offers a beautiful, gothic campus experience characterized by a 'work hard, play hard' mentality, strong Jesuit values, and a relatively preppy student body. Community service and vibrant weekend socializing are major pillars of campus life.",
    athleticsSnippet: "As the only Division I FBS school in Boston, BC football and hockey are massive social events. Tailgating is a beloved tradition, and game days unify the incredibly spirited student body.",
    safetySnippet: "Located in the wealthy and quiet suburb of Chestnut Hill, the campus is exceptionally safe and picturesque. Students enjoy the security of a closed campus while being just a trolley ride away from downtown Boston."
  },
  {
    name: "Rutgers University-Camden",
    studentLifeSnippet: "Rutgers-Camden offers a diverse, heavily commuter-based, and tight-knit urban campus experience. Students are deeply focused on pre-professional tracks, nursing, and utilizing the nearby resources of Philadelphia.",
    athleticsSnippet: "Athletics play a minor role on this Division III campus, with no football team. Students tend to focus more on local clubs, intramurals, or supporting the major sports teams across the river in Philly.",
    safetySnippet: "Camden has historically struggled with high urban crime rates, but the Rutgers campus is heavily secured with a massive police presence, great lighting, and constant patrols. Students generally feel safe within the campus bubble."
  },
  {
    name: "University of Georgia",
    studentLifeSnippet: "UGA offers the ultimate Southern college experience, defined by a stunning classic campus, massive Greek life, and vibrant downtown Athens nightlife. The student body is outgoing, incredibly spirited, and deeply loyal to the university.",
    athleticsSnippet: "Georgia Bulldogs football is the absolute center of the universe for this campus, dominating the culture year-round. Saturdays 'Between the Hedges' are massive, state-wide events featuring elite SEC competition.",
    safetySnippet: "Athens is a beloved, bustling college town, and while typical nightlife-related incidents occur, the campus is highly secure. UGA employs a massive police force and robust late-night transportation networks."
  },
  {
    name: "Villanova University",
    studentLifeSnippet: "Villanova features a strong Augustinian Catholic heritage that fosters a tight-knit, community-service-oriented, and generally preppy student body. Greek life and massive philanthropic events like NOVAdance dominate the social scene.",
    athleticsSnippet: "Villanova is a national powerhouse in college basketball, and the Wildcats' success defines the school's fierce athletic pride. Basketball games are the premier social events of the winter semester.",
    safetySnippet: "Located on the incredibly affluent Main Line of the Philadelphia suburbs, Villanova is considered exceptionally safe. The picturesque campus is heavily monitored and shielded from urban crime."
  },
  {
    name: "University of Washington-Seattle Campus",
    studentLifeSnippet: "UW blends a gorgeous, cherry-blossom-filled campus with the bustling, tech-forward vibe of Seattle. The massive student body is diverse and highly focused on tech and research, with a strong Greek system anchoring the social scene.",
    athleticsSnippet: "Husky football is a massive tradition, highlighted by the unique practice of 'sailgating' on Lake Washington outside the stadium. The sports culture is highly spirited and unifies the large commuter and residential populations.",
    safetySnippet: "The U-District is a dense, busy urban neighborhood where typical city street smarts are required. The university maintains a strong police presence and provides the NightRide shuttle to ensure safe travel after dark."
  },
  {
    name: "Florida State University",
    studentLifeSnippet: "FSU is renowned for its incredibly outgoing, spirited student body and a massive, deeply ingrained Greek life culture. The campus is vibrant, deeply social, and heavily focused on a 'work hard, play hard' lifestyle.",
    athleticsSnippet: "Seminoles football is historically elite, and game days at Doak Campbell Stadium are colossal, campus-defining events. The athletics culture is immense, loud, and integral to the Florida State identity.",
    safetySnippet: "Tallahassee is a large state capital and college town; while off-campus areas require standard awareness, the campus itself is well-secured. FSU Police are highly visible and maintain numerous safety programs."
  }
];

async function main() {
  for (const college of data) {
    try {
      await prisma.college.updateMany({
        where: { name: college.name },
        data: {
          studentLifeSnippet: college.studentLifeSnippet,
          athleticsSnippet: college.athleticsSnippet,
          safetySnippet: college.safetySnippet
        }
      });
      console.log(`Updated ${college.name}`);
    } catch (e) {
      console.error(`Failed to update ${college.name}`, e);
    }
  }
}

main().finally(() => prisma.$disconnect());

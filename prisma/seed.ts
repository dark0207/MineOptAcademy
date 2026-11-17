/**
 * Creates the first admin and starter content that follows MineOpt's real menu structure.
 * Safe to run repeatedly: existing modules, tutorials and users are left untouched, so admin edits are never overwritten.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile(".env");
} catch {
  // variables may already be set by the host
}

const db = new PrismaClient();

type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

type SeedTutorial = {
  title: string;
  summary: string;
  description: string;
  steps: string[];
  minutes: number;
  level: Level;
  featured?: boolean;
};

type SeedModule = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accent: string;
  tutorials: SeedTutorial[];
};

const modules: SeedModule[] = [
  {
    slug: "getting-started",
    name: "Getting Started",
    tagline: "Projects, licence and workspace basics",
    description: "Everything you need before your first optimisation: create and save projects, activate your licence, and set up the workspace the way you like it.",
    icon: "rocket",
    accent: "#34d399",
    tutorials: [
      {
        title: "Create, open and save a project",
        summary: "Start a new MineOpt project, reopen recent work and keep your changes safe.",
        description:
          "A MineOpt project holds your block model, parameters, designs and results in one file. This tutorial covers the **File** menu: creating a project, opening an existing one, saving, and jumping back into recent projects from the start page.",
        steps: [
          "Choose **File → New** (`Ctrl+N`) and enter the project name and location.",
          "Choose **File → Open** (`Ctrl+O`) to load an existing project file.",
          "Use **File → Recent Projects** to reopen something you worked on lately.",
          "Press `Ctrl+S` to save, or **Save As** to keep a copy under a new name.",
        ],
        minutes: 4,
        level: "BEGINNER",
        featured: true,
      },
      {
        title: "Import and check your licence",
        summary: "Activate MineOpt with a licence file and verify what it covers.",
        description: "MineOpt needs a valid licence to unlock its modules. Import the licence file you received, then open the licence information window to confirm the holder and expiry.",
        steps: ["Choose **File → License → Import License** and select your licence file.", "Choose **File → License → License Information** to review the details.", "Restart MineOpt if the module list does not refresh."],
        minutes: 3,
        level: "BEGINNER",
      },
      {
        title: "Themes and workspace layout",
        summary: "Switch between Dark, Dark Grey and Light themes and manage panels.",
        description: "Pick the theme that is easiest on your eyes for long sessions, and use the **Windows** menu to show or hide the panels of the page you are on.",
        steps: ["Open **View → Themes** and choose Dark, Dark Grey or Light.", "Open the **Windows** menu to toggle the panels of the current page.", "Use the **View** menu of each module to control what the 3D canvas displays."],
        minutes: 3,
        level: "BEGINNER",
      },
      {
        title: "Customise keyboard shortcuts",
        summary: "Review the default shortcuts and rebind them to match your habits.",
        description: "Page navigation and the PitOpt, AutoDesign and SchedOpt canvases all have shortcuts. They are saved per Windows user, so each person on a shared machine can have their own set.",
        steps: ["Choose **Options → Keyboard Shortcuts...**", "Select a command and press the new key combination.", "Resolve any conflict MineOpt reports, then confirm.", "Remove a shortcut by clearing its binding."],
        minutes: 4,
        level: "BEGINNER",
      },
      {
        title: "Move between modules and pages",
        summary: "Understand the three modules and the pages inside each of them.",
        description:
          "MineOpt is organised in three modules. **PitOpt** has Model, Graphs and 3D Canvas pages. **AutoDesign** has Boundary, Blocks and Reserves. **SchedOpt** has Block, Parameters, Road, Optimization and 3D Canvas. Work flows left to right through the pages.",
        steps: ["Pick a module from the toolbar on the start page.", "Use the page buttons to move through the module.", "Use the next / previous page shortcuts to move without the mouse."],
        minutes: 5,
        level: "BEGINNER",
      },
      {
        title: "Import a project from a previous version",
        summary: "Bring projects from an earlier MineOpt release into the current one.",
        description: "Projects saved by older releases can be imported rather than rebuilt. The importer maps your data to the current project format.",
        steps: ["Choose **Tools → Import Previous Version** and pick the version.", "Select the old project file.", "Review the imported data, then save it as a new project."],
        minutes: 3,
        level: "INTERMEDIATE",
      },
    ],
  },
  {
    slug: "pitopt",
    name: "PitOpt",
    tagline: "Pit optimisation and nested pit shells",
    description: "Turn a block model and your economics into optimal pit shells, review them in graphs, and explore the result in 3D.",
    icon: "mountain",
    accent: "#f5a524",
    tutorials: [
      {
        title: "Load and inspect a block model",
        summary: "Import a block model, check its grid and make sure the attributes are what you expect.",
        description:
          "Everything in PitOpt starts from the block model. On the **Model** page you load the file, review the grid definition, and confirm the attributes (grades, density, rock codes) before spending time on economics.",
        steps: ["Open the **PitOpt → Model** page.", "Import the block model file (CSV, or convert Surpac / Datamine files first with the Tools menu).", "Check the grid origin, block size and extents.", "Confirm the attributes were mapped correctly."],
        minutes: 8,
        level: "BEGINNER",
        featured: true,
      },
      {
        title: "Rock types and slope angles",
        summary: "Define rock types and the overall slope angles the optimiser must respect.",
        description: "Slope angles decide which blocks must be mined to reach others. Define your rock types, then assign slope angles by rock type and, where needed, by sector.",
        steps: ["Define each rock type and how it is recognised in the model.", "Enter the slope angle for every rock type.", "Add sector-specific slopes if the geotechnical design requires them."],
        minutes: 7,
        level: "INTERMEDIATE",
      },
      {
        title: "Costs, sale prices and discount rate",
        summary: "Enter mining and processing costs, price assumptions and the discount rate.",
        description: "The economic inputs convert every block into a value. Mining cost, milling cost, recoveries, sale price and the discount rate together drive which blocks pay for themselves.",
        steps: ["Enter mining costs, including any depth or bench adjustments.", "Enter milling and other processing costs.", "Build the sale price with the price builder.", "Set the discount rate used for NPV."],
        minutes: 10,
        level: "INTERMEDIATE",
      },
      {
        title: "Run the optimisation and generate pit shells",
        summary: "Run the optimiser across a range of revenue factors to get nested pit shells.",
        description: "Running PitOpt over a range of revenue factors produces a family of nested shells, from a small high-margin pit to the largest economic pit.",
        steps: ["Choose the range and step of the revenue factor.", "Start the optimisation and wait for the shells to be generated.", "Review the cumulative results for each shell."],
        minutes: 8,
        level: "INTERMEDIATE",
      },
      {
        title: "Review results with graphs",
        summary: "Use the Graphs page to compare shells by tonnes, grade and value.",
        description: "The **Graphs** page plots the shell results so you can see where adding more waste stops paying off, and which shell is a sensible basis for design.",
        steps: ["Open **PitOpt → Graphs**.", "Pick the series to plot.", "Compare shells and note the candidate pits."],
        minutes: 6,
        level: "BEGINNER",
      },
      {
        title: "Explore shells in the 3D canvas",
        summary: "Navigate the model in 3D, slice it with section lines and colour the shells.",
        description: "The **3D Canvas** shows blocks and shells together. Use section lines and planes to look inside the pit, and the PitShell colours option to tell shells apart.",
        steps: ["Open **PitOpt → 3D Canvas**.", "Rotate, pan and zoom with the mouse or the view cube.", "Add a section line to cut through the model.", "Change shell colours with **Options → PitShell Colors**."],
        minutes: 9,
        level: "BEGINNER",
      },
    ],
  },
  {
    slug: "autodesign",
    name: "AutoDesign",
    tagline: "From optimal shell to practical pit design",
    description: "Build benches, ramps and dumps around the optimal shell, calculate reserves, and export the result to your CAD package.",
    icon: "compass",
    accent: "#60a5fa",
    tutorials: [
      {
        title: "Import the design boundary",
        summary: "Bring in the boundary that limits your design.",
        description: "The boundary on the **Boundary** page limits where AutoDesign is allowed to build benches. Import it first so every later step respects it.",
        steps: ["Open **AutoDesign → Boundary**.", "Import the boundary file.", "Check it displays where you expect in the canvas."],
        minutes: 5,
        level: "BEGINNER",
        featured: true,
      },
      {
        title: "Import blocks and filter solids",
        summary: "Load the blocks and use the solid filter to select what belongs in the design.",
        description: "On the **Blocks** page you import the blocks and can filter them by solid, so the reserves reflect only the material you intend to mine.",
        steps: ["Open **AutoDesign → Blocks**.", "Import the block file.", "Open the solid filter and choose the solids to include.", "Apply the filter and review the result."],
        minutes: 7,
        level: "INTERMEDIATE",
      },
      {
        title: "Design benches and edit pit lines",
        summary: "Generate the bench design, then refine the pit lines by hand where needed.",
        description: "AutoDesign generates a first bench design. Use the editing tools to move points, insert or delete vertices and cut lines, then apply your edits to a bench or the whole line.",
        steps: ["Generate the bench design.", "Switch to edit mode on the canvas.", "Move, insert or delete points on a pit line.", "Apply or discard the edit, and undo if you change your mind."],
        minutes: 12,
        level: "ADVANCED",
      },
      {
        title: "Ramp design and segment lines",
        summary: "Design ramps and convert them into editable segment lines.",
        description: "Ramps are designed as part of the pit and can be converted to segment lines for detailed editing, one segment at a time.",
        steps: ["Set the ramp parameters (width, gradient, direction).", "Generate the ramp.", "Convert the ramp to segment lines.", "Edit individual segments in the segment line dialog."],
        minutes: 10,
        level: "ADVANCED",
      },
      {
        title: "Dump design",
        summary: "Create waste dump designs alongside the pit.",
        description: "Waste has to go somewhere. Design dump lifts with the same tools you use for the pit so the dump fits the available footprint.",
        steps: ["Choose the dump area.", "Set the lift height and batter angle.", "Generate the dump and review the capacity."],
        minutes: 8,
        level: "INTERMEDIATE",
      },
      {
        title: "Calculate and export reserves",
        summary: "Get tonnes and grades inside your design, and export them.",
        description: "The **Reserves** page reports what is inside your design. Export the report to share with planning and finance.",
        steps: ["Open **AutoDesign → Reserves**.", "Run the reserves calculation.", "Review tonnes and grades by bench or zone.", "Export the report."],
        minutes: 6,
        level: "BEGINNER",
      },
    ],
  },
  {
    slug: "schedopt",
    name: "SchedOpt",
    tagline: "Production scheduling and haul logistics",
    description: "Turn a pit design into a period-by-period production schedule that respects capacities, quality targets and haul distances.",
    icon: "calendar",
    accent: "#a78bfa",
    tutorials: [
      {
        title: "Prepare and filter blocks",
        summary: "Load the blocks to schedule and narrow them down with filters.",
        description: "The **Block** page is where the scheduling data enters SchedOpt. Use the filters so the schedule only includes the material you want, then check the totals.",
        steps: ["Open **SchedOpt → Block**.", "Import the blocks.", "Apply a block filter to remove what should not be scheduled.", "Check the totals."],
        minutes: 7,
        level: "BEGINNER",
        featured: true,
      },
      {
        title: "Build a filter with the filter graph",
        summary: "Combine conditions visually in the filter graph window.",
        description: "For filters that go beyond a single condition, the filter graph lets you connect fields and values visually, and save the filter to reuse later.",
        steps: ["Open the filter graph from the Block page.", "Add nodes for the fields you want to test.", "Connect them and set the values.", "Save the filter for reuse."],
        minutes: 9,
        level: "INTERMEDIATE",
      },
      {
        title: "Set periods, capacities and quality targets",
        summary: "Define the schedule periods and the limits the optimiser must respect.",
        description: "On the **Parameters** page you describe the schedule: how long each period is, the mining and processing capacities, and the quality ranges to hold.",
        steps: ["Open **SchedOpt → Parameters**.", "Define the periods.", "Enter the mining and processing capacities.", "Set the quality constraints."],
        minutes: 10,
        level: "INTERMEDIATE",
      },
      {
        title: "Define haul roads and distances",
        summary: "Describe the road network so haulage cost and time are modelled.",
        description: "The **Road** page captures how material moves from pit to destinations. Distances feed the haulage calculations in the optimisation.",
        steps: ["Open **SchedOpt → Road**.", "Add the roads and their distances.", "Review the distances table for gaps."],
        minutes: 6,
        level: "INTERMEDIATE",
      },
      {
        title: "Run the schedule optimisation",
        summary: "Start the optimiser and understand its results.",
        description: "With blocks, parameters and roads in place, run the optimisation on the **Optimization** page and review the resulting schedule period by period.",
        steps: ["Open **SchedOpt → Optimization**.", "Choose the optimisation options.", "Run it and watch progress.", "Review the schedule and the cash flow."],
        minutes: 9,
        level: "ADVANCED",
        featured: true,
      },
      {
        title: "Review and animate in the 3D canvas",
        summary: "Watch the mining sequence unfold period by period.",
        description: "The 3D canvas can colour blocks by period and animate the sequence, which is the quickest way to spot an unrealistic mining order.",
        steps: ["Open **SchedOpt → 3D Canvas**.", "Colour the blocks by period.", "Play the animation and step through the periods."],
        minutes: 6,
        level: "BEGINNER",
      },
    ],
  },
  {
    slug: "advanced-optimization",
    name: "Advanced Optimization",
    tagline: "Stochastic optimisation and NPV analysis",
    description: "Go beyond a single deterministic answer: optimise across uncertainty, and compare pit-by-pit NPV.",
    icon: "chart",
    accent: "#f472b6",
    tutorials: [
      {
        title: "Pit-by-pit NPV",
        summary: "Compare the net present value of each pit in the nest.",
        description: "The **NPV Opt** menu evaluates each pit shell on discounted value rather than undiscounted, which often points to a smaller, earlier-paying pit.",
        steps: ["Run a PitOpt optimisation first.", "Choose **NPV Opt → Pit-by-Pit NPV**.", "Review the NPV of each pit and the best case."],
        minutes: 8,
        level: "ADVANCED",
        featured: true,
      },
      {
        title: "Stochastic PitOpt optimiser",
        summary: "Optimise the pit across several simulated block models.",
        description: "Instead of one block model, the stochastic optimiser works across several equally likely realisations, so the pit reflects grade uncertainty.",
        steps: ["Choose **Stochastic Opt → PitOpt → Optimizer**.", "Select the realisations to use.", "Run and review the results across realisations."],
        minutes: 10,
        level: "ADVANCED",
      },
      {
        title: "Stochastic direction of mining",
        summary: "Set the mining direction used by the stochastic optimiser.",
        description: "The direction of mining guides the order in which the optimiser opens the pit. Choose it before you run the stochastic optimiser.",
        steps: ["Choose **Stochastic Opt → PitOpt → Direction of Mining**.", "Pick the direction.", "Confirm and run the optimiser."],
        minutes: 5,
        level: "ADVANCED",
      },
      {
        title: "Stochastic SchedOpt optimiser",
        summary: "Schedule production with uncertainty in the block model.",
        description: "Run the scheduler across several realisations to see how robust a schedule is, instead of trusting a single estimate.",
        steps: ["Complete the SchedOpt parameters and roads first.", "Choose **Stochastic Opt → SchedOpt → Optimizer**.", "Run it and compare the outcomes."],
        minutes: 10,
        level: "ADVANCED",
      },
      {
        title: "Loss, dilution and range revenue",
        summary: "Account for ore loss and dilution, and revenue that varies by range.",
        description: "Real mining never recovers exactly what the model says. Loss and dilution settings and range revenue let your economics reflect that.",
        steps: ["Open the loss and dilution settings.", "Enter the loss and dilution percentages.", "Set revenue by range where needed."],
        minutes: 7,
        level: "ADVANCED",
      },
    ],
  },
  {
    slug: "data-tools-reports",
    name: "Data Tools & Reports",
    tagline: "Converters, filters, expressions and exports",
    description: "Prepare data for MineOpt and get results out of it: converters, expressions, pivot tables and every export.",
    icon: "wrench",
    accent: "#2dd4bf",
    tutorials: [
      {
        title: "Block model filter",
        summary: "Filter a block model on any attribute before using it.",
        description: "Use **Tools → Block Model Filter** to cut a model down to the part you need, and save the filter for repeat use.",
        steps: ["Choose **Tools → Block Model Filter**.", "Add the filter conditions.", "Apply and save the filter."],
        minutes: 6,
        level: "BEGINNER",
        featured: true,
      },
      {
        title: "Convert Surpac and Datamine files to CSV",
        summary: "Turn MDL, FBM and DM files into CSV that MineOpt can import.",
        description: "MineOpt imports CSV block models. The **Tools** menu converts Surpac MDL and FBM files and Datamine DM files to CSV for you.",
        steps: ["Choose the converter for your file type under **Tools**.", "Select the input file.", "Choose the output CSV and convert."],
        minutes: 5,
        level: "BEGINNER",
      },
      {
        title: "Default quality, expressions and global expression",
        summary: "Define default attribute values and calculated attributes.",
        description: "Use **Options → Default Quality** to set values for missing attributes, and the expression builder to create calculated attributes. The global expression applies to the whole project.",
        steps: ["Open **Options → Default Quality** and set defaults.", "Open the expression builder to create a calculated attribute.", "Use **Options → Global Expression** for project-wide formulas."],
        minutes: 9,
        level: "INTERMEDIATE",
      },
      {
        title: "Pivot tables",
        summary: "Summarise results by any combination of fields.",
        description: "The pivot table summarises tonnes, grades and value by the fields you choose, and can be exported as a report.",
        steps: ["Open the pivot table dialog.", "Choose the row and column fields.", "Choose the values to summarise.", "Export the report."],
        minutes: 6,
        level: "INTERMEDIATE",
      },
      {
        title: "Export pit shells, zones and designs",
        summary: "Get shells, zone polygons and toe / crest lines into other software.",
        description: "The **Export** menu writes pit shells, zone polygons, designs (toe and crest lines) and solid metadata in formats other mining software can read.",
        steps: ["Open the **Export** menu.", "Choose PitShell, Zone Polygon, Design or Solid Meta.", "Choose what to export and where to save it."],
        minutes: 6,
        level: "BEGINNER",
      },
      {
        title: "PitOpt and SchedOpt reports",
        summary: "Export cumulative, incremental, cash flow and detailed reports.",
        description: "Results can be exported as reports: PitOpt cumulative, incremental, shell bench and zone reports, and SchedOpt summary, cash flow and detailed reports.",
        steps: ["Run the optimisation first.", "Open **Export → PitOpt Results** or **SchedOpt Results**.", "Choose the report and save it."],
        minutes: 5,
        level: "BEGINNER",
      },
    ],
  },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

async function seedContent() {
  let createdModules = 0;
  let createdTutorials = 0;

  for (const [moduleIndex, m] of modules.entries()) {
    let parent = await db.module.findUnique({ where: { slug: m.slug } });
    if (!parent) {
      parent = await db.module.create({
        data: { slug: m.slug, name: m.name, tagline: m.tagline, description: m.description, icon: m.icon, accent: m.accent, sortOrder: moduleIndex },
      });
      createdModules++;
    }

    for (const [index, t] of m.tutorials.entries()) {
      const slug = slugify(t.title);
      if (await db.tutorial.findUnique({ where: { slug } })) continue;

      await db.tutorial.create({
        data: {
          moduleId: parent.id,
          slug,
          title: t.title,
          summary: t.summary,
          description: t.description,
          steps: t.steps.map((step, i) => `${i + 1}. ${step}`).join("\n"),
          durationMinutes: t.minutes,
          level: t.level,
          featured: t.featured ?? false,
          published: true,
          sortOrder: index,
        },
      });
      createdTutorials++;
    }
  }
  console.log(`Content: ${createdModules} module(s) and ${createdTutorials} tutorial(s) created.`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.log("Admin: ADMIN_EMAIL / ADMIN_PASSWORD not set, no admin created.");
    return;
  }
  if (await db.user.findUnique({ where: { email } })) {
    console.log(`Admin: ${email} already exists.`);
    return;
  }
  await db.user.create({
    data: { email, name: "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Admin: created ${email}. Sign in and change the password.`);
}

seedAdmin()
  .then(seedContent)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

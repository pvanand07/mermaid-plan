import type { Template } from './types'

export const templateCategories = [
  'All',
  'Flowcharts',
  'Sequence',
  'Class',
  'ER Diagrams',
  'Architecture',
  'State',
  'Gantt',
  'Planning',
  'Pie & Charts',
  'User Journey',
  'Mindmaps',
]

export const templates: Template[] = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    description: 'Visualize processes, workflows, and decision paths.',
    category: 'Flowcharts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Action A]
    B -->|No| D[Action B]
    C --> E[End]
    D --> E`,
  },
  {
    id: 'flowchart-lr',
    name: 'Horizontal Flowchart',
    description: 'Left-to-right pipeline for data or request flows.',
    category: 'Flowcharts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `flowchart LR
    A[Input] --> B[Process]
    B --> C{Valid?}
    C -->|Yes| D[Output]
    C -->|No| E[Error]`,
  },
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    description: 'Show interactions between systems or actors over time.',
    category: 'Sequence',
    iconColor: 'tint-violet-text',
    bgColor: 'tint-violet-bg',
    starred: true,
    mermaidCode: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hi Alice!`,
  },
  {
    id: 'class',
    name: 'Class Diagram',
    description: 'Model object-oriented structures and relationships.',
    category: 'Class',
    iconColor: 'tint-blue-text',
    bgColor: 'tint-blue-bg',
    starred: false,
    mermaidCode: `classDiagram
    class User {
      +String name
      +login()
    }
    class Admin {
      +manageUsers()
    }
    User <|-- Admin`,
  },
  {
    id: 'requirement',
    name: 'Requirement Diagram',
    description: 'Link requirements to system elements and verification.',
    category: 'Class',
    iconColor: 'tint-blue-text',
    bgColor: 'tint-blue-bg',
    starred: false,
    mermaidCode: `requirementDiagram
    requirement req_auth {
      id: 1
      text: User must authenticate
      risk: medium
      verifymethod: test
    }
    element login_page {
      type: interface
    }
    login_page - satisfies -> req_auth`,
  },
  {
    id: 'er',
    name: 'ER Diagram',
    description: 'Define entities and relationships in your data model.',
    category: 'ER Diagrams',
    iconColor: 'tint-cyan-text',
    bgColor: 'tint-cyan-bg',
    starred: false,
    mermaidCode: `erDiagram
    USER ||--o{ POST : writes
    POST ||--|{ COMMENT : has`,
  },
  {
    id: 'c4',
    name: 'C4 Context',
    description: 'Map people, software systems, and their relationships.',
    category: 'Architecture',
    iconColor: 'tint-slate-text',
    bgColor: 'tint-slate-bg',
    starred: false,
    mermaidCode: `C4Context
    title System Context
    Person(user, "User", "An end user of the system")
    System(app, "Application", "Core product")
    System_Ext(email, "Email Service", "Sends notifications")
    Rel(user, app, "Uses")
    Rel(app, email, "Sends mail", "SMTP")`,
  },
  {
    id: 'block',
    name: 'Block Diagram',
    description: 'Lay out system components and their connections.',
    category: 'Architecture',
    iconColor: 'tint-slate-text',
    bgColor: 'tint-slate-bg',
    starred: false,
    mermaidCode: `block-beta
    columns 3
    Frontend blockArrowId6<[" "]>(right) Backend
    space:2 down<[" "]>(down)
    Disk left<[" "]>(left) Database[("Database")]`,
  },
  {
    id: 'gantt',
    name: 'Gantt Chart',
    description: 'Plan and track project timelines and milestones.',
    category: 'Gantt',
    iconColor: 'tint-orange-text',
    bgColor: 'tint-orange-bg',
    starred: false,
    mermaidCode: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Research :a1, 2024-01-01, 14d
    section Build
    Development :a2, after a1, 30d`,
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Chronicle events and milestones across periods.',
    category: 'Planning',
    iconColor: 'tint-orange-text',
    bgColor: 'tint-orange-bg',
    starred: false,
    mermaidCode: `timeline
    title Product Roadmap
    section Q1
      Launch MVP : Beta release
    section Q2
      Scale : v1.0 release
    section Q3
      Expand : International rollout`,
  },
  {
    id: 'kanban',
    name: 'Kanban Board',
    description: 'Track work items across columns from todo to done.',
    category: 'Planning',
    iconColor: 'tint-orange-text',
    bgColor: 'tint-orange-bg',
    starred: false,
    mermaidCode: `kanban
    Todo
      [Write docs]
      [Fix bugs]
    In Progress
      [Build feature]
    Done
      [Setup project]`,
  },
  {
    id: 'gitgraph',
    name: 'Git Graph',
    description: 'Visualize branches, commits, and merges.',
    category: 'Planning',
    iconColor: 'tint-violet-text',
    bgColor: 'tint-violet-bg',
    starred: false,
    mermaidCode: `gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Add feature"
    checkout main
    merge develop`,
  },
  {
    id: 'state',
    name: 'State Diagram',
    description: 'Illustrate state transitions in a system or process.',
    category: 'State',
    iconColor: 'tint-amber-text',
    bgColor: 'tint-amber-bg',
    starred: false,
    mermaidCode: `stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    description: 'Display proportional data in a circular chart.',
    category: 'Pie & Charts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `pie title Distribution
    "A" : 45
    "B" : 25
    "C" : 20
    "D" : 10`,
  },
  {
    id: 'quadrant',
    name: 'Quadrant Chart',
    description: 'Plot items on two axes to compare and prioritize.',
    category: 'Pie & Charts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `quadrantChart
    title Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Quick wins
    quadrant-2 Major projects
    quadrant-3 Fill-ins
    quadrant-4 Thankless tasks
    Task A: [0.2, 0.8]
    Task B: [0.7, 0.6]`,
  },
  {
    id: 'xychart',
    name: 'XY Chart',
    description: 'Compare values over categories with bars or lines.',
    category: 'Pie & Charts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `xychart-beta
    title "Monthly Sales"
    x-axis [Jan, Feb, Mar, Apr, May]
    y-axis "Revenue" 0 --> 100
    bar [30, 45, 60, 55, 70]`,
  },
  {
    id: 'sankey',
    name: 'Sankey Diagram',
    description: 'Show how quantities flow between stages or categories.',
    category: 'Pie & Charts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `sankey-beta
    Source,Target,Value
    Visitors,Signups,120
    Signups,Active,80
    Signups,Churned,40
    Active,Paying,35`,
  },
  {
    id: 'journey',
    name: 'User Journey',
    description: 'Map user experiences across touchpoints and stages.',
    category: 'User Journey',
    iconColor: 'tint-pink-text',
    bgColor: 'tint-pink-bg',
    starred: false,
    mermaidCode: `journey
    title User Experience
    section Browse
      View page: 5: User
      Click link: 3: User
    section Convert
      Sign up: 4: User`,
  },
  {
    id: 'mindmap',
    name: 'Mindmap',
    description: 'Brainstorm ideas in a hierarchical tree structure.',
    category: 'Mindmaps',
    iconColor: 'tint-pink-text',
    bgColor: 'tint-pink-bg',
    starred: false,
    mermaidCode: `mindmap
    root((Product))
      Features
      Roadmap
      Metrics`,
  },
  {
    id: 'flowchart-subgraph',
    name: 'Flowchart with Subgraphs',
    description: 'Group related steps into nested subgraph sections.',
    category: 'Flowcharts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `flowchart TD
    subgraph Frontend
        A[Browser] --> B[React App]
    end
    subgraph Backend
        C[API Server] --> D[(Database)]
    end
    B --> C`,
  },
  {
    id: 'sequence-alt',
    name: 'Sequence with Alt/Opt',
    description: 'Model conditional paths and optional steps in interactions.',
    category: 'Sequence',
    iconColor: 'tint-violet-text',
    bgColor: 'tint-violet-bg',
    starred: false,
    mermaidCode: `sequenceDiagram
    participant U as User
    participant A as App
    participant S as Server
    U->>A: Submit form
    alt Valid input
        A->>S: POST /api/data
        S-->>A: 200 OK
        A-->>U: Success message
    else Invalid input
        A-->>U: Validation error
    end
    opt Logging enabled
        A->>S: POST /api/log
    end`,
  },
  {
    id: 'er-extended',
    name: 'ER Diagram (Extended)',
    description: 'Model multiple entities with attributes and relationships.',
    category: 'ER Diagrams',
    iconColor: 'tint-cyan-text',
    bgColor: 'tint-cyan-bg',
    starred: false,
    mermaidCode: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    CUSTOMER {
        string id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date created_at
    }
    PRODUCT {
        int id PK
        string name
        float price
    }`,
  },
  {
    id: 'c4-container',
    name: 'C4 Container',
    description: 'Show containers, databases, and their interactions inside a system.',
    category: 'Architecture',
    iconColor: 'tint-slate-text',
    bgColor: 'tint-slate-bg',
    starred: false,
    mermaidCode: `C4Container
    title Container Diagram
    Person(user, "User", "Uses the application")
    System_Boundary(c1, "Application") {
        Container(web, "Web App", "React", "Delivers the UI")
        Container(api, "API", "Node.js", "Handles requests")
        ContainerDb(db, "Database", "PostgreSQL", "Stores data")
    }
    Rel(user, web, "Uses", "HTTPS")
    Rel(web, api, "Calls", "JSON/HTTPS")
    Rel(api, db, "Reads/Writes", "SQL")`,
  },
  {
    id: 'architecture-beta',
    name: 'Architecture Diagram',
    description: 'Map cloud services, groups, and directional connections.',
    category: 'Architecture',
    iconColor: 'tint-slate-text',
    bgColor: 'tint-slate-bg',
    starred: false,
    mermaidCode: `architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service disk(disk)[Storage] in api
    service server(server)[Server] in api
    db:L -- R:server
    disk:T -- B:server`,
  },
  {
    id: 'packet-beta',
    name: 'Packet Diagram',
    description: 'Illustrate network packet structure with bit-level fields.',
    category: 'Architecture',
    iconColor: 'tint-slate-text',
    bgColor: 'tint-slate-bg',
    starred: false,
    mermaidCode: `packet-beta
    title UDP Packet
    +16: "Source Port"
    +16: "Destination Port"
    +16: "Length"
    +16: "Checksum"`,
  },
  {
    id: 'state-composite',
    name: 'Composite State Diagram',
    description: 'Nest states inside composite states with transitions.',
    category: 'State',
    iconColor: 'tint-amber-text',
    bgColor: 'tint-amber-bg',
    starred: false,
    mermaidCode: `stateDiagram-v2
    [*] --> Active
    state Active {
        [*] --> Idle
        Idle --> Processing : start
        Processing --> Idle : done
    }
    Active --> Suspended : pause
    Suspended --> Active : resume
    Active --> [*]`,
  },
  {
    id: 'radar-beta',
    name: 'Radar Chart',
    description: 'Compare entities across multiple dimensions on a radar plot.',
    category: 'Pie & Charts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `radar-beta
    title Skills Assessment
    axis math["Math"], science["Science"], english["English"]
    curve alice["Alice"]{85, 90, 80}
    curve bob["Bob"]{70, 75, 85}
    max 100
    min 0`,
  },
  {
    id: 'treemap-beta',
    name: 'Treemap',
    description: 'Show hierarchical data as nested proportional rectangles.',
    category: 'Pie & Charts',
    iconColor: 'tint-emerald-text',
    bgColor: 'tint-emerald-bg',
    starred: false,
    mermaidCode: `treemap-beta
"Products"
    "Electronics"
        "Phones": 50
        "Computers": 30
    "Clothing"
        "Men's": 40
        "Women's": 40`,
  },
  {
    id: 'ishikawa-beta',
    name: 'Ishikawa (Fishbone)',
    description: 'Analyze root causes branching from a central problem.',
    category: 'Planning',
    iconColor: 'tint-orange-text',
    bgColor: 'tint-orange-bg',
    starred: false,
    mermaidCode: `ishikawa-beta
    Slow Response Time
    Network
        High latency
        Packet loss
    Server
        CPU overload
        Memory leak
    Database
        Slow queries
        Missing indexes`,
  },
  {
    id: 'info',
    name: 'Info Diagram',
    description: 'Display Mermaid version and runtime information.',
    category: 'Planning',
    iconColor: 'tint-violet-text',
    bgColor: 'tint-violet-bg',
    starred: false,
    mermaidCode: `info`,
  },
]

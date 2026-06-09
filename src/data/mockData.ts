export interface Folder {
  id: string
  name: string
  count: number
  color: string
  iconColor: string
}

export interface Diagram {
  id: string
  title: string
  type: string
  editedAgo: string
  starred: boolean
  folder?: string
  mermaidCode: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  iconColor: string
  bgColor: string
  starred: boolean
  mermaidCode: string
}

export const folders: Folder[] = [
  { id: '1', name: 'Architecture', count: 8, color: 'tint-violet-bg', iconColor: 'tint-violet-text' },
  { id: '2', name: 'Product Roadmaps', count: 5, color: 'tint-blue-bg', iconColor: 'tint-blue-text' },
  { id: '3', name: 'System Design', count: 6, color: 'tint-emerald-bg', iconColor: 'tint-emerald-text' },
  { id: '4', name: 'Engineering Docs', count: 4, color: 'tint-orange-bg', iconColor: 'tint-orange-text' },
]

export const diagrams: Diagram[] = [
  {
    id: '1',
    title: 'AI Workflow Flowchart',
    type: 'Flowchart',
    editedAgo: '2 hours ago',
    starred: true,
    folder: 'Architecture',
    mermaidCode: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E`,
  },
  {
    id: '2',
    title: 'User Journey',
    type: 'User Journey',
    editedAgo: '5 hours ago',
    starred: false,
    mermaidCode: `journey
    title User Journey
    section Discovery
      Visit website: 5: User
      Browse products: 3: User
    section Purchase
      Add to cart: 4: User
      Checkout: 2: User`,
  },
  {
    id: '3',
    title: 'Payments Sequence',
    type: 'Sequence',
    editedAgo: '1 day ago',
    starred: true,
    folder: 'System Design',
    mermaidCode: `sequenceDiagram
    participant U as User
    participant A as API
    participant P as Payment
    U->>A: Submit order
    A->>P: Process payment
    P-->>A: Confirmation
    A-->>U: Order complete`,
  },
  {
    id: '4',
    title: 'Inventory ERD',
    type: 'ER Diagram',
    editedAgo: '2 days ago',
    starred: false,
    mermaidCode: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "ordered in"`,
  },
  {
    id: '5',
    title: 'Release Gantt',
    type: 'Gantt',
    editedAgo: '3 days ago',
    starred: false,
    folder: 'Product Roadmaps',
    mermaidCode: `gantt
    title Release Plan
    dateFormat YYYY-MM-DD
    section Phase 1
    Design    :a1, 2024-01-01, 30d
    section Phase 2
    Development :a2, after a1, 45d`,
  },
  {
    id: '6',
    title: 'Architecture Class Diagram',
    type: 'Class Diagram',
    editedAgo: '4 days ago',
    starred: true,
    folder: 'Architecture',
    mermaidCode: `classDiagram
    class Animal {
      +String name
      +move()
    }
    class Dog {
      +bark()
    }
    Animal <|-- Dog`,
  },
  {
    id: '7',
    title: 'Database Schema',
    type: 'Database',
    editedAgo: '5 days ago',
    starred: false,
    mermaidCode: `erDiagram
    USER {
      int id PK
      string email
      string name
    }
    POST {
      int id PK
      string title
      int user_id FK
    }
    USER ||--o{ POST : writes`,
  },
  {
    id: '8',
    title: 'System State Flow',
    type: 'State Diagram',
    editedAgo: '1 week ago',
    starred: false,
    folder: 'Engineering Docs',
    mermaidCode: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Complete : done
    Processing --> Error : fail
    Complete --> [*]
    Error --> Idle : retry`,
  },
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
]

export const defaultEditorCode = `flowchart LR
    A[ASML EUV Lithography]:::green
    B[TSMC Wafer Fabrication]:::green
    C[NVIDIA GPU AI Chips]:::blue
    D[HBM Memory SK Hynix]:::purple
    E[Broadcom Networking Silicon]:::orange
    F[Marvell Networking Silicon]:::orange
    G[Astera Labs PCIe Retimers]:::orange
    H[Networking Fabric High Growth]:::green
    I[AI Demand Growth Driver]:::blue
    A --> B
    B --> C
    B --> D
    C --> H
    E --> H
    F --> H
    G --> H
    I --> C
    classDef green fill:#E8F5E9,stroke:#4CAF50,color:#333
    classDef blue fill:#E3F2FD,stroke:#2196F3,color:#333
    classDef purple fill:#F3E5F5,stroke:#9C27B0,color:#333
    classDef orange fill:#FFF3E0,stroke:#FF9800,color:#333
    class A,B,H green
    class C,I blue
    class D purple
    class E,F,G orange`

export const templateCategories = [
  'All',
  'Flowcharts',
  'Diagrams',
  'Sequence',
  'Class',
  'ER Diagrams',
  'Gantt',
  'State',
  'Pie & Charts',
  'User Journey',
]

export const badgeColors: Record<string, string> = {
  Flowchart: 'badge-flowchart',
  'User Journey': 'badge-journey',
  Sequence: 'badge-sequence',
  'ER Diagram': 'badge-er',
  Gantt: 'badge-gantt',
  'Class Diagram': 'badge-class',
  Database: 'badge-database',
  'State Diagram': 'badge-state',
}

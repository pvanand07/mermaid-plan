import type { Diagram, Folder } from './types'

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

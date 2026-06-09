import type { Template } from './types'

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

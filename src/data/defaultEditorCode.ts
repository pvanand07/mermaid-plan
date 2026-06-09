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

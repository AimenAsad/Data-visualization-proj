This interactive dashboard allows users to upload any flat JSON file (array of objects) and explore the data through four advanced D3 visualizations:

Radial Bar Chart: Visualize distribution of a numeric field across categories.
Chord Diagram: Show relationships between entities via an array field.
Force-Directed Graph: Display network connections from an array field.
Sunburst Chart: Explore hierarchies by selecting multiple categorical levels.

All charts support brushing & linking: clicking on an element in one chart highlights corresponding elements in the others.

Folder Structure

project-root\
├── data                     
├── js\
│   ├── dashboard.js           
│   ├── radial_bar.js         
│   ├── chord.js               
│   ├── force_directed.js     
│   └── sunburst.js           
├── index.html                 
├── style.css                 
└── README.md                

How to Run Locally

1. Open the project folder in VS Code.
2. Start the Live Server extension (right-click index.html → Open with Live Server).
3. Click the "Choose JSON File" button to upload any flat JSON file.
4. Select fields in each control panel and click the corresponding "Draw" button.

Assumptions & Notes

The JSON must be a flat array of objects; nested objects are not supported except as leaf values in hierarchical (sunburst) fields.
Array‐typed fields are used for Chord and Force graphs. Numeric fields are optional weights.
No third-party chart libraries were used—only D3.js v7.

Technical Challenges & Decisions

Dynamic Field Detection: We inspect the first row and entire dataset to classify each column as numeric, categorical, array, or object.
Brushing & Linking: A single d3.dispatch event bus enables coordinated highlighting across modules.
Responsive Layout: CSS Grid and card styling ensure the dashboard adapts to different screen widths.

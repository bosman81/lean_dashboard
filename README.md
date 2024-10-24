# lean_dashboard
Simple dashboard to display backtest analysis data loaded from JSON file output by LEAN

## Setup

Serve the Project Locally

### A. Using Python
Open the terminal or command prompt.  
Navigate to your project folder using the cd command:  
python -m http.server 8000  
Open your browser and go to http://localhost:8000. You should see your dashboard.

### B. Using Node.js (if you have Node.js installed):  
Open the terminal or command prompt.  
Navigate to your project folder using the cd command:  
npm install -g http-server  
http-server -p 8000  
Open your browser and go to http://localhost:8000.

### C. Using Visual Studio Code (VSCode) with the Live Server Extension:  
Open VSCode and open your project folder.  
Install the Live Server extension from the Extensions marketplace.  
Right-click the index.html file in VSCode and select "Open with Live Server".  
The browser will open automatically and show your dashboard.

### Usage
Once the page loads in your favorite browser:
- Click choose file and browse to your JSON file that was produced by the backtest
- Click Load Data

### Features
This is not meant to be a fully featured dashboard. It is a starting point with  
references and examples to do everything you need to display the data output from the backtest.  

### Example Output

![image](https://github.com/user-attachments/assets/a5cc5971-0b79-4ca3-8f6a-ef038e946cec)

![image](https://github.com/user-attachments/assets/a2e03328-d49a-4958-bfb8-0fa09d99f4fc)

![image](https://github.com/user-attachments/assets/785df96a-90ad-42af-b61e-f10332bf92ca)


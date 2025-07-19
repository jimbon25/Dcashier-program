# D'Cashier

D'Cashier is a modern and intuitive cashier application designed to streamline product management, sales processes, and transaction reporting. This project was created for educational and portfolio purposes, demonstrating the application of best practices in modern software development.

## Key Features

- **Product Management**: Easily add, edit, delete, and manage products, including images and barcodes.
- **Cashier System**: Fast sales processing with a user-friendly interface, including support for discounts and various payment methods.
- **Stock Management**: Track product stock in real-time to avoid running out of items.
- **Comprehensive Reports**: Gain deep insights with daily sales reports, top-selling products, and profit/loss statements.
- **User Management**: Role-based system with secure authentication for admins and cashiers.
- **Modern Interface**: A clean, responsive UI/UX, complete with a dark mode for visual comfort.

## Technologies Used

- **Frontend**:
  - React.js & TypeScript
  - Redux Toolkit for state management
  - React Bootstrap for UI components
  - Axios for HTTP requests
- **Backend**:
  - Node.js & Express.js with TypeScript
  - SQLite3 for a lightweight database
  - JSON Web Tokens (JWT) for authentication
  - Multer for file uploads

## Installation and Running

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Git](https://git-scm.com/)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jimbon21/Dcashier-program.git
    cd Dcashier-program
    ```

2.  **Install dependencies for both projects (backend & frontend):**
    ```bash
    npm install
    ```

3.  **Run the application (backend & frontend concurrently):**
    ```bash
    npm start
    ```
    - The backend will run on `http://localhost:8000`.
    - The frontend will run on `http://localhost:3000`.

## Usage

- **Login**: Use the following credentials to try the application:
  - **Admin**: `admin` / `admin123`
  - **Cashier**: `cashier` / `cashier123`
- **Dashboard**: View sales summaries and other important metrics.
- **Cashier**: Perform sales transactions, scan barcodes, and manage the shopping cart.
- **Management**: (Admin only) Manage products, categories, and users.
- **Reports**: Analyze business performance with various available reports.
export const DASHBOARD_PRIMENG_STYLES = `
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;

      h1 {
        color: #0f172a;
        margin: 0 0 0.4rem;
      }

      p {
        margin: 0;
        color: #475569;
      }
    }
  }

  .summary-grid,
  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .metric {
    margin: 0;
    color: #475569;
    font-size: 0.92rem;
  }

  :host ::ng-deep .p-card {
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 8px rgba(15, 23, 42, 0.05);
    border-radius: 0.75rem;
  }

  :host ::ng-deep .action-grid .p-button {
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .dashboard .dashboard-header {
      flex-direction: column;
    }
  }
`;


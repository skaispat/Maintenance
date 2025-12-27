# Services Documentation

This directory contains service files that handle data fetching, manipulation, and communication with the Supabase backend for different aspects of the machine details functionality.

## Services Overview

### 1. `overviewService.ts`
Handles data related to the machine overview tab:
- Fetching basic machine information
- Updating machine specifications

### 2. `maintenanceService.ts`
Manages maintenance tasks for machines:
- Fetching maintenance tasks
- Creating new maintenance tasks
- Updating existing maintenance tasks
- Deleting maintenance tasks

### 3. `repairHistoryService.ts`
Handles repair history records:
- Fetching repair history
- Adding new repair history entries
- Updating repair history entries
- Deleting repair history entries

### 4. `documentsService.ts`
Manages machine-related documents:
- Fetching documents for a machine
- Uploading new documents
- Deleting documents

### 5. `purchasesAssetsService.ts`
Handles store purchases and fixed assets:
- Fetching store purchases
- Adding new store purchases
- Updating store purchases
- Deleting store purchases
- Fetching fixed assets
- Adding new fixed assets
- Updating fixed assets
- Deleting fixed assets

### 6. `analyticsService.ts`
Manages analytics data:
- Fetching analytics data for charts
- Fetching repair costs over time
- Fetching usage hours over time
- Updating analytics data

### 7. `machineService.ts` (existing)
Core service for machine data:
- Fetching machine details
- Creating new machines
- Fetching all machines

## Usage Patterns

All services follow a consistent pattern:
1. Import the Supabase client
2. Import relevant types from the models
3. Export async functions that:
   - Check if Supabase is properly initialized
   - Perform database operations
   - Transform data between snake_case (database) and camelCase (frontend)
   - Handle errors appropriately
   - Return typed results or null/false on failure

## Error Handling

All services include proper error handling with:
- Try/catch blocks around Supabase operations
- Console error logging for debugging
- Throwing errors for critical failures
- Returning null/false for non-critical failures
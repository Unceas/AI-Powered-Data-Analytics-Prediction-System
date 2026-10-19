import { createContext, useContext } from 'react';
import type { WorkspaceContextValue } from '../types';

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

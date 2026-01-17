import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { Permissions, Scopes } from '../consts/Permissions';
import useAuth from './AuthProvider';

interface PermissionContextType {
  hasAccess: (permission: Scopes) => boolean;
}

const PermissionContext = createContext<PermissionContextType>(
  {} as PermissionContextType,
);

export function PermissionProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { loading, user } = useAuth();

  const hasAccess = useCallback(
    (permission: Scopes): boolean => {
      if (loading || !user) return false;

      return Permissions[user.userType]?.includes(permission) ?? false;
    },
    [loading, user],
  );

  const memoizedValue = useMemo(
    () => ({
      hasAccess,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAccess, loading, user],
  );

  return (
    <PermissionContext.Provider value={memoizedValue}>
      {children}
    </PermissionContext.Provider>
  );
}

export default function usePermission() {
  return useContext(PermissionContext);
}

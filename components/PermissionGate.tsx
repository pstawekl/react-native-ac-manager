import { Scopes } from '../consts/Permissions';
import usePermission from '../providers/PermissionProvider';

type PermissionGateProps = {
  children: JSX.Element;
  permission: Scopes;
};

export default function PermissionGate({
  children,
  permission,
}: PermissionGateProps): JSX.Element | null {
  const { hasAccess } = usePermission();

  if (!hasAccess(permission)) {
    return null;
  }

  return children;
}

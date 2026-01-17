import { isEmpty } from 'lodash';
import useAuth from '../providers/AuthProvider';
import { CatalogsProvider } from '../providers/CatalogsProvider';
import { CertsProvider } from '../providers/CertsProvider';
import { ChatProvider } from '../providers/ChatProvider';
import { ClientsProvider } from '../providers/ClientsProvider';
import { GalleryProvider } from '../providers/GalleryProvider';
import { OffersProvider } from '../providers/OffersProvider';
import { PermissionProvider } from '../providers/PermissionProvider';
import { StaffProvider } from '../providers/StaffProvider';
import { TasksProvider } from '../providers/TasksProvider';
import LoadingScreen from '../screens/Loading/LoadingScreen';
import AuthNavigation from './AuthNavigation';
import BottomTabNavigation from './BottomTabNavigation';

function RootNavigation() {
  const { user, loading, token } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Sprawdź czy użytkownik ma ważne dane (id >= 0, może być 0) i token
  // name może być zbudowane z first_name + last_name lub być bezpośrednio w name
  const userName = user?.name || (user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user?.first_name || user?.last_name || user?.email || '');
  
  const shouldShowMainNavigation = Boolean(
    user &&
    !isEmpty(user) &&
    (user.id !== undefined && user.id !== null) &&
    token &&
    user.email &&
    userName
  );


  return shouldShowMainNavigation ? (
    <PermissionProvider>
      <ChatProvider>
        <GalleryProvider>
          <ClientsProvider>
            <TasksProvider>
              <CatalogsProvider>
                <CertsProvider>
                  <StaffProvider>
                    <OffersProvider>
                      <BottomTabNavigation />
                    </OffersProvider>
                  </StaffProvider>
                </CertsProvider>
              </CatalogsProvider>
            </TasksProvider>
          </ClientsProvider>
        </GalleryProvider>
      </ChatProvider>
    </PermissionProvider>
  ) : (
    <AuthNavigation />
  );
}

export default RootNavigation;

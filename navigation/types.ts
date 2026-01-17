import {
  DrawerNavigationProp,
  DrawerScreenProps,
} from '@react-navigation/drawer';
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { Client } from '../providers/ClientsProvider';
import { Device } from '../providers/OffersProvider';

export type AuthParamList = {
  Loading: undefined;
  Home: undefined;
  Login: undefined;
  Registration: { token?: string; email?: string } | undefined;
};

export type LoginScreenNavigationProp = StackScreenProps<
  AuthParamList,
  'Login'
>;

export type BottomTabParamList = {
  HomeTab: NavigatorScreenParams<MainParamList>;
  NotificationsTab: undefined;
  ChatTab: undefined;
  FabTab: undefined;
  MenuTab: undefined;
};

export type NotificationsParamList = {
  Notifications: undefined;
};

export type MainParamList = {
  Home: undefined;
  Clients: undefined;
  Map: undefined;
  Tasks: TasksParamList;
  Calendar: TasksParamList;
  Invoices: undefined;
  Offers: undefined;
  Catalogs: TasksParamList;
  Certs: undefined;
  GalleryStack: NavigatorScreenParams<GalleryParamList>;
  Prices: TasksParamList;
  Chat: NavigatorScreenParams<ChatParamList>;
  Settings: NavigatorScreenParams<SettingsParamList>;
};

export type GalleryParamList = {
  Gallery: undefined;
  Edit: { uri: string };
  AddPhoto: undefined;
};

export type InvoicesParamList = {
  List: undefined;
  Details: undefined;
  Form: {
    clientId?: number;
    installationId?: number;
    sourceScreen?: string;
    from?: string;
  };
  Overview: undefined;
};

export type SettingsParamList = {
  Menu: { returnTo?: keyof MainParamList } | undefined;
  Data: undefined;
  Staff: undefined;
  AddTeam: undefined;
  AddEmployee: undefined;
  Offers: undefined;
  Invoices: undefined;
  Discounts: undefined;
  Texts: undefined;
};

export type OffersParamList = {
  Menu: {
    tab?: string;
    from?: string;
    installationId?: number;
    clientId?: number;
    autoShowAddOverlay?: boolean;
  };
  List: { from?: string; installationId?: number; clientId?: number };
  AddToolForm: {
    type: string | boolean;
    installationId: number | null;
    offerName?: string;
    isTemplate?: boolean;
  };
  AddSurchargeForm: {
    type: string;
    installationId: number | null;
    devices: number[];
    offerName?: string;
    mode?: string;
    isTemplate?: boolean;
  };
  Overview: {
    type: string;
    installationId: number | null;
    devices: number[];
    surcharges: number[];
    promos?: number[];
    mode: string;
    offerId?: number;
    isTemplate?: string | boolean;
    offerName?: string;
    deviceSurcharges?: {
      [deviceId: number]: {
        surcharges: Array<{
          id: string;
          surchargeId: number | null;
          customValue?: number;
        }>;
        discount: number | null;
      };
    };
    allDevices?: Device[];
    surchargesList?: {
      name: string;
      id: number;
      value: number | null;
    }[];
  };
  OfferTemplatesList: undefined;
  OfferTemplateForm: { template?: any };
};

export type TasksParamList = {
  Menu: {
    tab?: string;
  };
  Filter: undefined;
  AddForm: { task?: any };
  TaskDetails: { task: any };
};

export type ClientsParamList = {
  List: undefined;
  Menu: {
    clientId: number;
    client?: Client;
    activeTab?: 'dane' | 'zadania' | 'instalacje' | 'oferty';
    autoShowInstallationOverlay?: boolean;
  };
  Inspection: { installationId: string; clientId: string };
  Installation: undefined;
  InstallationsList: { clientId: number };
  Service: {
    installationId: string;
    montageId?: number;
    serviceType?: 'przeglad' | 'serwis';
  };
  InvoiceData: undefined;
  Form: { client?: Client };
  Settings: { installationId: string; clientId: string };
  InstallationForm: undefined;
};

export type CertificatesParamList = {
  CertificatesList: undefined;
  AddCertificate: undefined;
  AddTraining: undefined;
};

export type CatalogsParamList = {
  Menu: { tab?: string };
  AddCatalog: undefined;
  AddPriceList: undefined;
  AddFlyer: undefined;
};

export type ChatParamList = {
  ConversationsList: undefined;
  ChatScreen: { conversationId: number; otherParticipantName: string };
  ClientSelector: undefined;
};

export type GalleryScreenProps = CompositeScreenProps<
  StackScreenProps<GalleryParamList>,
  DrawerScreenProps<MainParamList, 'GalleryStack'>
>;

export type GalleryEditScreenProps = CompositeScreenProps<
  StackScreenProps<GalleryParamList, 'Edit'>,
  DrawerScreenProps<MainParamList, 'GalleryStack'>
>;

export type GalleryAddScreenProps = CompositeScreenProps<
  StackScreenProps<GalleryParamList, 'AddPhoto'>,
  DrawerScreenProps<MainParamList, 'GalleryStack'>
>;

export type ClientListScreenProps = CompositeScreenProps<
  StackScreenProps<ClientsParamList, 'List'>,
  DrawerScreenProps<MainParamList, 'Clients'>
>;

export type ClientMenuScreenProps = CompositeScreenProps<
  StackScreenProps<ClientsParamList, 'Menu'>,
  DrawerScreenProps<MainParamList, 'Clients'>
>;

export type ClientFormScreenProps = CompositeScreenProps<
  StackScreenProps<ClientsParamList, 'Form'>,
  DrawerScreenProps<MainParamList, 'Clients'>
>;

export type ClientInstallationsListScreenProps = CompositeScreenProps<
  StackScreenProps<ClientsParamList, 'InstallationsList'>,
  DrawerScreenProps<MainParamList, 'Clients'>
>;

export type InvoicesListScreenProps = CompositeScreenProps<
  StackScreenProps<InvoicesParamList, 'List'>,
  DrawerScreenProps<MainParamList, 'Invoices'>
>;

export type InvoiceFormScreenProps = CompositeScreenProps<
  StackScreenProps<InvoicesParamList, 'Form'>,
  DrawerScreenProps<MainParamList, 'Invoices'>
>;

export type OffersListScreenProps = CompositeScreenProps<
  StackScreenProps<OffersParamList, 'List'>,
  DrawerScreenProps<MainParamList, 'Offers'>
>;

export type OfferAddToolFormScreenProps = CompositeScreenProps<
  StackScreenProps<OffersParamList, 'AddToolForm'>,
  DrawerScreenProps<MainParamList, 'Offers'>
>;

export type OfferAddSurchargeFormScreenProps = CompositeScreenProps<
  StackScreenProps<OffersParamList, 'AddSurchargeForm'>,
  DrawerScreenProps<MainParamList, 'Offers'>
>;

export type SettingsMenuScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'Menu'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;

export type SettingsDataScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'Data'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;

export type SettingsStaffScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'Staff'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;

export type SettingsAddTeamScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'AddTeam'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;
export type SettingsAddEmployeeScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'AddEmployee'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;

export type SettingsInvoicesScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'Invoices'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;
export type SettingsOffersScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'Offers'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;
export type SettingsDiscountsScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'Discounts'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;

export type SettingsTextsScreenProps = CompositeScreenProps<
  StackScreenProps<SettingsParamList, 'Texts'>,
  DrawerScreenProps<MainParamList, 'Settings'>
>;

export type TasksMenuScreenProps = CompositeScreenProps<
  StackScreenProps<TasksParamList, 'Menu'>,
  DrawerScreenProps<MainParamList, 'Tasks'>
>;

export type CertificatesScreenProps = CompositeScreenProps<
  StackScreenProps<CertificatesParamList, 'CertificatesList'>,
  DrawerScreenProps<MainParamList, 'Certs'>
>;

export type AddCertificateScreenProps = CompositeScreenProps<
  StackScreenProps<CertificatesParamList, 'AddCertificate'>,
  DrawerScreenProps<MainParamList, 'Certs'>
>;

export type AddTrainingScreenProps = CompositeScreenProps<
  StackScreenProps<CertificatesParamList, 'AddTraining'>,
  DrawerScreenProps<MainParamList, 'Certs'>
>;

export type CatalogsMenuScreenProps = CompositeScreenProps<
  StackScreenProps<CatalogsParamList, 'Menu'>,
  DrawerScreenProps<MainParamList, 'Catalogs'>
>;

export type CatalogsAddCatalogScreenProps = CompositeScreenProps<
  StackScreenProps<CatalogsParamList, 'AddCatalog'>,
  DrawerScreenProps<MainParamList, 'Catalogs'>
>;

export type CatalogsAddPriceListScreenProps = CompositeScreenProps<
  StackScreenProps<CatalogsParamList, 'AddPriceList'>,
  DrawerScreenProps<MainParamList, 'Catalogs'>
>;

export type CatalogsAddFlyerScreenProps = CompositeScreenProps<
  StackScreenProps<CatalogsParamList, 'AddFlyer'>,
  DrawerScreenProps<MainParamList, 'Catalogs'>
>;

<script setup lang="ts">
import { 
  Building2, 
  Settings as SettingsIcon, 
  Wifi, 
  Bell, 
  Receipt, 
  Upload,
  TestTube,
  Palette,
  Save
} from 'lucide-vue-next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings } from '~/composables/useSettings';
import { toast } from 'vue-sonner';

const { settings, loading, testing, fetchSettings, updateSettings, testEFDConnection, uploadLogo } = useSettings();

const businessForm = ref({
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  businessTIN: '',
  receiptHeader: '',
  receiptFooter: '',
  primaryColor: '#3b82f6'
});

const systemForm = ref({
  taxRate: 18,
  currency: 'TZS',
  currencySymbol: 'TZS',
  dateFormat: 'DD/MM/YYYY',
  receiptNumberFormat: 'SALE-{TIMESTAMP}-{COUNTER}'
});

const efdForm = ref({
  efdEnabled: false,
  efdEndpoint: '',
  efdApiKey: ''
});

const notificationForm = ref({
  lowStockThreshold: 5,
  emailNotificationsEnabled: false,
  notificationEmail: '',
  alertSoundEnabled: true,
  alertOnLowStock: true,
  alertOnOutOfStock: true,
  alertOnDeadStock: false,
  deadStockDays: 30
});

const receiptForm = ref({
  printReceiptAutomatically: false,
  showTaxOnReceipt: true,
  showBarcodesOnReceipt: false
});

const logoPreview = ref<string | null>(null);
const logoFile = ref<File | null>(null);

onMounted(async () => {
  await fetchSettings();
  loadSettingsIntoForms();
});

watch(() => settings.value, () => {
  if (settings.value) {
    loadSettingsIntoForms();
  }
});

const loadSettingsIntoForms = () => {
  if (!settings.value) return;

  businessForm.value = {
    businessName: settings.value.businessName || '',
    businessAddress: settings.value.businessAddress || '',
    businessPhone: settings.value.businessPhone || '',
    businessTIN: settings.value.businessTIN || '',
    receiptHeader: settings.value.receiptHeader || '',
    receiptFooter: settings.value.receiptFooter || '',
    primaryColor: settings.value.primaryColor || '#3b82f6'
  };

  systemForm.value = {
    taxRate: settings.value.taxRate || 18,
    currency: settings.value.currency || 'TZS',
    currencySymbol: settings.value.currencySymbol || 'TZS',
    dateFormat: settings.value.dateFormat || 'DD/MM/YYYY',
    receiptNumberFormat: settings.value.receiptNumberFormat || 'SALE-{TIMESTAMP}-{COUNTER}'
  };

  efdForm.value = {
    efdEnabled: settings.value.efdEnabled || false,
    efdEndpoint: settings.value.efdEndpoint || '',
    efdApiKey: settings.value.efdApiKey || ''
  };

  notificationForm.value = {
    lowStockThreshold: settings.value.lowStockThreshold || 5,
    emailNotificationsEnabled: settings.value.emailNotificationsEnabled || false,
    notificationEmail: settings.value.notificationEmail || '',
    alertSoundEnabled: settings.value.alertSoundEnabled !== undefined ? settings.value.alertSoundEnabled : true,
    alertOnLowStock: settings.value.alertOnLowStock !== undefined ? settings.value.alertOnLowStock : true,
    alertOnOutOfStock: settings.value.alertOnOutOfStock !== undefined ? settings.value.alertOnOutOfStock : true,
    alertOnDeadStock: settings.value.alertOnDeadStock || false,
    deadStockDays: settings.value.deadStockDays || 30
  };

  receiptForm.value = {
    printReceiptAutomatically: settings.value.printReceiptAutomatically || false,
    showTaxOnReceipt: settings.value.showTaxOnReceipt !== undefined ? settings.value.showTaxOnReceipt : true,
    showBarcodesOnReceipt: settings.value.showBarcodesOnReceipt || false
  };

  logoPreview.value = settings.value.businessLogo || null;
};

const handleLogoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    logoFile.value = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

const saveBusinessSettings = async () => {
  try {
    if (logoFile.value) {
      await uploadLogo(logoFile.value);
      logoFile.value = null;
    }
    
    await updateSettings(businessForm.value);
  } catch (error) {
    console.error('Failed to save business settings:', error);
  }
};

const saveSystemSettings = async () => {
  try {
    await updateSettings(systemForm.value);
  } catch (error) {
    console.error('Failed to save system settings:', error);
  }
};

const saveEFDSettings = async () => {
  try {
    await updateSettings(efdForm.value);
  } catch (error) {
    console.error('Failed to save EFD settings:', error);
  }
};

const saveNotificationSettings = async () => {
  try {
    await updateSettings(notificationForm.value);
  } catch (error) {
    console.error('Failed to save notification settings:', error);
  }
};

const saveReceiptSettings = async () => {
  try {
    await updateSettings(receiptForm.value);
  } catch (error) {
    console.error('Failed to save receipt settings:', error);
  }
};

const handleTestEFD = async () => {
  if (!efdForm.value.efdEndpoint || !efdForm.value.efdApiKey) {
    toast.error('Please enter EFD endpoint and API key');
    return;
  }
  
  await testEFDConnection(efdForm.value.efdEndpoint, efdForm.value.efdApiKey);
};

const efdStatusBadge = computed(() => {
  if (!settings.value?.efdTestStatus) return { variant: 'outline', text: 'Not Tested' };
  
  switch (settings.value.efdTestStatus) {
    case 'success':
      return { variant: 'default', text: 'Connected' };
    case 'failed':
      return { variant: 'destructive', text: 'Failed' };
    default:
      return { variant: 'secondary', text: 'Pending' };
  }
});
</script>

<template>
  <div class="container mx-auto py-6 px-4 space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground mt-1">
        Configure your business and system preferences
      </p>
    </div>

    <Tabs default-value="business" class="space-y-4">
      <TabsList>
        <TabsTrigger value="business">
          <Building2 class="h-4 w-4 mr-2" />
          Business
        </TabsTrigger>
        <TabsTrigger value="system">
          <SettingsIcon class="h-4 w-4 mr-2" />
          System
        </TabsTrigger>
        <TabsTrigger value="efd">
          <Wifi class="h-4 w-4 mr-2" />
          EFD
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell class="h-4 w-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="receipts">
          <Receipt class="h-4 w-4 mr-2" />
          Receipts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="business" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Configure your business details and branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-4">
              <Skeleton class="h-10 w-full" v-for="i in 6" :key="i" />
            </div>
            <div v-else class="space-y-6">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="logo">Business Logo</Label>
                  <div class="flex items-center gap-4">
                    <div v-if="logoPreview" class="w-24 h-24 border rounded-lg flex items-center justify-center overflow-hidden">
                      <img :src="logoPreview" alt="Logo" class="max-w-full max-h-full object-contain" />
                    </div>
                    <div v-else class="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted">
                      <Building2 class="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        @change="handleLogoUpload"
                        class="max-w-xs"
                      />
                      <p class="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="primaryColor">Primary Color</Label>
                  <div class="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      v-model="businessForm.primaryColor"
                      type="color"
                      class="w-20 h-10"
                    />
                    <Input
                      v-model="businessForm.primaryColor"
                      placeholder="#3b82f6"
                      class="flex-1"
                    />
                    <div 
                      class="w-10 h-10 rounded border"
                      :style="{ backgroundColor: businessForm.primaryColor }"
                    />
                  </div>
                </div>

                <Separator />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label for="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      v-model="businessForm.businessName"
                      placeholder="Your Business Name"
                    />
                  </div>

                  <div class="space-y-2">
                    <Label for="businessPhone">Phone Number</Label>
                    <Input
                      id="businessPhone"
                      v-model="businessForm.businessPhone"
                      placeholder="+255 XXX XXX XXX"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="businessAddress">Address</Label>
                  <Textarea
                    id="businessAddress"
                    v-model="businessForm.businessAddress"
                    placeholder="Business address"
                    rows="3"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="businessTIN">Tax ID (TIN)</Label>
                  <Input
                    id="businessTIN"
                    v-model="businessForm.businessTIN"
                    placeholder="123-456-789"
                  />
                </div>

                <Separator />

                <div class="space-y-2">
                  <Label for="receiptHeader">Receipt Header</Label>
                  <Textarea
                    id="receiptHeader"
                    v-model="businessForm.receiptHeader"
                    placeholder="Text to appear at the top of receipts"
                    rows="2"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="receiptFooter">Receipt Footer</Label>
                  <Textarea
                    id="receiptFooter"
                    v-model="businessForm.receiptFooter"
                    placeholder="Text to appear at the bottom of receipts"
                    rows="2"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <Button @click="saveBusinessSettings" :disabled="loading">
                  <Save class="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="system" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Configure system-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-4">
              <Skeleton class="h-10 w-full" v-for="i in 5" :key="i" />
            </div>
            <div v-else class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    v-model="systemForm.taxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="currency">Currency</Label>
                  <Select v-model="systemForm.currency">
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="dateFormat">Date Format</Label>
                  <Select v-model="systemForm.dateFormat">
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-2">
                  <Label for="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    v-model="systemForm.currencySymbol"
                    placeholder="TZS"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="receiptNumberFormat">Receipt Number Format</Label>
                <Input
                  id="receiptNumberFormat"
                  v-model="systemForm.receiptNumberFormat"
                  placeholder="SALE-{TIMESTAMP}-{COUNTER}"
                />
                <p class="text-xs text-muted-foreground">
                  Use {TIMESTAMP} and {COUNTER} as placeholders
                </p>
              </div>

              <div class="flex justify-end">
                <Button @click="saveSystemSettings" :disabled="loading">
                  <Save class="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="efd" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <span>EFD Integration (TRA)</span>
              <Badge :variant="efdStatusBadge.variant as any">
                {{ efdStatusBadge.text }}
              </Badge>
            </CardTitle>
            <CardDescription>
              Configure connection to TRA's EFD system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-4">
              <Skeleton class="h-10 w-full" v-for="i in 4" :key="i" />
            </div>
            <div v-else class="space-y-6">
              <div class="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p class="font-medium">Enable EFD</p>
                  <p class="text-sm text-muted-foreground">
                    Send sales data to TRA automatically
                  </p>
                </div>
                <Switch v-model:checked="efdForm.efdEnabled" />
              </div>

              <div class="space-y-2">
                <Label for="efdEndpoint">EFD Endpoint URL</Label>
                <Input
                  id="efdEndpoint"
                  v-model="efdForm.efdEndpoint"
                  placeholder="https://api.efd.tra.go.tz/..."
                  :disabled="!efdForm.efdEnabled"
                />
              </div>

              <div class="space-y-2">
                <Label for="efdApiKey">API Key</Label>
                <Input
                  id="efdApiKey"
                  v-model="efdForm.efdApiKey"
                  type="password"
                  placeholder="Your EFD API key"
                  :disabled="!efdForm.efdEnabled"
                />
              </div>

              <div v-if="settings?.efdLastTestDate" class="p-3 bg-muted rounded-lg">
                <p class="text-sm">
                  <span class="font-medium">Last tested:</span>
                  {{ new Date(settings.efdLastTestDate).toLocaleString() }}
                </p>
              </div>

              <div class="flex justify-between">
                <Button 
                  @click="handleTestEFD" 
                  variant="outline"
                  :disabled="!efdForm.efdEnabled || testing || loading"
                >
                  <TestTube class="mr-2 h-4 w-4" />
                  Test Connection
                </Button>
                <Button @click="saveEFDSettings" :disabled="loading">
                  <Save class="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-4">
              <Skeleton class="h-10 w-full" v-for="i in 6" :key="i" />
            </div>
            <div v-else class="space-y-6">
              <div class="space-y-2">
                <Label for="lowStockThreshold">Default Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  v-model="notificationForm.lowStockThreshold"
                  type="number"
                  min="0"
                />
              </div>

              <Separator />

              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p class="font-medium">Alert Sound</p>
                    <p class="text-sm text-muted-foreground">
                      Play sound for notifications
                    </p>
                  </div>
                  <Switch v-model:checked="notificationForm.alertSoundEnabled" />
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p class="font-medium">Low Stock Alerts</p>
                    <p class="text-sm text-muted-foreground">
                      Notify when stock is low
                    </p>
                  </div>
                  <Switch v-model:checked="notificationForm.alertOnLowStock" />
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p class="font-medium">Out of Stock Alerts</p>
                    <p class="text-sm text-muted-foreground">
                      Notify when stock is depleted
                    </p>
                  </div>
                  <Switch v-model:checked="notificationForm.alertOnOutOfStock" />
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p class="font-medium">Dead Stock Alerts</p>
                    <p class="text-sm text-muted-foreground">
                      Notify for products with no sales
                    </p>
                  </div>
                  <Switch v-model:checked="notificationForm.alertOnDeadStock" />
                </div>
              </div>

              <div v-if="notificationForm.alertOnDeadStock" class="space-y-2">
                <Label for="deadStockDays">Dead Stock Threshold (Days)</Label>
                <Input
                  id="deadStockDays"
                  v-model="notificationForm.deadStockDays"
                  type="number"
                  min="1"
                />
                <p class="text-xs text-muted-foreground">
                  Products with no sales for this many days will be flagged
                </p>
              </div>

              <Separator />

              <div class="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p class="font-medium">Email Notifications</p>
                  <p class="text-sm text-muted-foreground">
                    Send alerts via email
                  </p>
                </div>
                <Switch v-model:checked="notificationForm.emailNotificationsEnabled" />
              </div>

              <div v-if="notificationForm.emailNotificationsEnabled" class="space-y-2">
                <Label for="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  v-model="notificationForm.notificationEmail"
                  type="email"
                  placeholder="alerts@yourbusiness.com"
                />
              </div>

              <div class="flex justify-end">
                <Button @click="saveNotificationSettings" :disabled="loading">
                  <Save class="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="receipts" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Settings</CardTitle>
            <CardDescription>
              Configure receipt printing and display options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-4">
              <Skeleton class="h-10 w-full" v-for="i in 3" :key="i" />
            </div>
            <div v-else class="space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p class="font-medium">Auto-Print Receipts</p>
                    <p class="text-sm text-muted-foreground">
                      Automatically print after each sale
                    </p>
                  </div>
                  <Switch v-model:checked="receiptForm.printReceiptAutomatically" />
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p class="font-medium">Show Tax on Receipt</p>
                    <p class="text-sm text-muted-foreground">
                      Display tax breakdown on receipts
                    </p>
                  </div>
                  <Switch v-model:checked="receiptForm.showTaxOnReceipt" />
                </div>

                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p class="font-medium">Show Barcodes</p>
                    <p class="text-sm text-muted-foreground">
                      Display product barcodes on receipts
                    </p>
                  </div>
                  <Switch v-model:checked="receiptForm.showBarcodesOnReceipt" />
                </div>
              </div>

              <div class="flex justify-end">
                <Button @click="saveReceiptSettings" :disabled="loading">
                  <Save class="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
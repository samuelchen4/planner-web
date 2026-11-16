export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? 'https://dfdwcpcwdxpuikjtmxci.supabase.co',
  supabaseKey:
    import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_Fr_dJXh0zZAnBImhkXI36A_5JdIKw9S',
  powerSyncUrl:
    import.meta.env.VITE_POWERSYNC_URL ??
    'https://6af7ca52e5558a7422b9db59.powersync.journeyapps.com',
  apiUrl: import.meta.env.VITE_API_URL ?? 'https://planner-api-dev-qwgcby2x5a-uk.a.run.app',
};

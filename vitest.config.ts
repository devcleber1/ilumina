import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/api.ts',
        'src/lib/socket.ts',
        'src/lib/utils.ts',
        'src/lib/storageService.ts',
        'src/contexts/AlertContext.tsx',
        'src/contexts/AuthContext.tsx',
        'src/hooks/use-mobile.ts',
        'src/Components/AuthGuard.tsx',
        'src/Components/AlertContainer.tsx',
        'src/Components/AppSidebar.tsx',
        'src/Components/SessionTimeoutModal.tsx',
        'src/Components/ChangePasswordModal.tsx',
        'src/Components/ui/FormInput.tsx',
        'src/Components/ui/BaseModal.tsx',
        'src/Pages/Auth/Auth.tsx',
        'src/routes/index.tsx'
      ]
    }
  }
})

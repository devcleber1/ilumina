import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppSidebar } from '../../Components/AppSidebar'
import { SidebarProvider } from '../../Components/ui/sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { AlertProvider } from '../../contexts/AlertContext'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../Components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
  SidebarFooter: ({ children }: any) => <div>{children}</div>,
  SidebarGroup: ({ children }: any) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarHeader: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <div>{children}</div>,
  SidebarMenuButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  SidebarMenuItem: ({ children }: any) => <div>{children}</div>,
  useSidebar: () => ({ toggleSidebar: vi.fn() }),
}))

describe('AppSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)
  })

  it('deve renderizar o sidebar com os itens corretos para o superadmin', () => {
    render(
      <MemoryRouter>
        <AlertProvider>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </AlertProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Iluminando o Futuro')).toBeInTheDocument()
    expect(screen.getByText('Admin Teste')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LogDetailModal, type ILog } from './LogDetailModal'

// Mock da API Axios para evitar requisições reais de rede durante testes de componentes
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        totalActions: 10,
        lastSeen: '2026-05-18T10:00:00.000Z',
        mostFrequentAction: 'UPDATE_USER'
      }
    })
  }
}))

const mockLog: ILog = {
  _id: 'mock-log-id-123',
  userId: 42,
  userName: 'Cleber Junior',
  userRole: 'admin',
  userAvatar: undefined,
  action: 'UPDATE_USER',
  module: 'Admin',
  description: 'Cleber atualizou as configurações do usuário.',
  status: 'success',
  ip: '192.168.0.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  metadata: { targetUserId: 100 },
  createdAt: '2026-05-18T10:00:00.000Z'
}

describe('LogDetailModal Component', () => {
  it('deve renderizar os detalhes fundamentais do log quando aberto', () => {
    render(
      <LogDetailModal
        log={mockLog}
        isOpen={true}
        onClose={() => {}}
        onFilterByUser={() => {}}
      />
    )

    // Verifica se os dados principais estão na tela
    expect(screen.getByText('Cleber Junior')).toBeInTheDocument()
    
    // Como os termos são exibidos em português, verificamos cargo e módulo traduzidos
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Administração')).toBeInTheDocument()
    
    expect(screen.getByText('Atualização de Usuário')).toBeInTheDocument()
    expect(screen.getByText('Cleber atualizou as configurações do usuário.')).toBeInTheDocument()
    expect(screen.getByText('Sucesso')).toBeInTheDocument()
  })

  it('não deve renderizar nada se isOpen for false', () => {
    const { container } = render(
      <LogDetailModal
        log={mockLog}
        isOpen={false}
        onClose={() => {}}
        onFilterByUser={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('deve manter a seção colapsável fechada por padrão e abri-la ao clicar', async () => {
    render(
      <LogDetailModal
        log={mockLog}
        isOpen={true}
        onClose={() => {}}
        onFilterByUser={() => {}}
      />
    )

    // Informações dentro do colapsável não devem estar visíveis de início
    expect(screen.queryByText('192.168.0.xxx')).not.toBeInTheDocument()
    expect(screen.queryByText('"targetUserId": 100')).not.toBeInTheDocument()

    // Clica no botão de expandir dados do ambiente
    const expandBtn = screen.getByRole('button', { name: /dados do ambiente/i })
    fireEvent.click(expandBtn)

    // Agora devem estar visíveis
    expect(screen.getByText('192.168.0.xxx')).toBeInTheDocument() // IP mascarado
    expect(screen.getByText(/"targetUserId": 100/)).toBeInTheDocument()
  })

  it('deve chamar onClose ao clicar no botão de fechar', () => {
    const onCloseMock = vi.fn()
    render(
      <LogDetailModal
        log={mockLog}
        isOpen={true}
        onClose={onCloseMock}
        onFilterByUser={() => {}}
      />
    )

    const closeBtn = screen.getByLabelText('Fechar modal')
    fireEvent.click(closeBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onFilterByUser com o ID correto e fechar o modal', () => {
    const onFilterByUserMock = vi.fn()
    const onCloseMock = vi.fn()
    
    render(
      <LogDetailModal
        log={mockLog}
        isOpen={true}
        onClose={onCloseMock}
        onFilterByUser={onFilterByUserMock}
      />
    )

    const filterBtn = screen.getByRole('button', { name: /ver todos os logs deste usuário/i })
    fireEvent.click(filterBtn)

    expect(onFilterByUserMock).toHaveBeenCalledWith(42)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})

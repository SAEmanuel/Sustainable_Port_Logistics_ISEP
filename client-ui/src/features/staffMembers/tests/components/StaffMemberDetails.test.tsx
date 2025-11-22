import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from '@testing-library/react';
import StaffMemberDetails from '../../components/StaffMemberDetails';
import type { StaffMember } from "../../domain/staffMember";
import * as service from '../../services/staffMemberService';
import * as helpers from '../../helpers/staffMemberHelpers';
import * as notify from '../../../../utils/notify';
import userEvent from '@testing-library/user-event';

const mockToggleStatus = vi.spyOn(service, 'toggleStaffMemberStatus');
const mockGetWeekDayNames = vi.spyOn(helpers, 'getWeekDayNames');

const mockNotifyLoading = vi.spyOn(notify, 'notifyLoading');
const mockNotifySuccess = vi.spyOn(notify, 'notifySuccess');

vi.mock('react-hot-toast', () => ({
    default: {
        dismiss: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        success: vi.fn(),
    }
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('StaffMemberDetails', () => {
    const mockStaff: StaffMember = {
        id: '1',
        mecanographicNumber: 'M001',
        shortName: 'Maria Silva',
        email: 'maria.s@test.com',
        phone: '123456789',
        schedule: { shift: 'Morning', daysOfWeek: '0000011' },
        isActive: true,
        qualificationCodes: ['Q1', 'Q2']
    };
    const mockOnClose = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnToggleSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetWeekDayNames.mockReturnValue(['Monday', 'Tuesday']);
    });

    it('deve renderizar todos os detalhes e qualificações corretamente', () => {
        render(<StaffMemberDetails staffMember={mockStaff} onClose={mockOnClose} onEdit={mockOnEdit} onToggleSuccess={mockOnToggleSuccess} />);

        expect(screen.getByText('M001')).toBeInTheDocument();
        expect(screen.getByText('maria.s@test.com')).toBeInTheDocument();
        expect(screen.getByText(/shiftType.Morning/)).toBeInTheDocument();
        expect(screen.getByText('Q1')).toBeInTheDocument();
        expect(screen.getByText('staffMembers.statusActive')).toBeInTheDocument();
    });

    it('deve chamar onEdit ao clicar no botão de edição', async () => {
        render(<StaffMemberDetails staffMember={mockStaff} onClose={mockOnClose} onEdit={mockOnEdit} onToggleSuccess={mockOnToggleSuccess} />);

        await userEvent.click(screen.getByRole('button', { name: 'staffMembers.edit' }));

        expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onClose ao clicar no botão de fechar', async () => {
        render(<StaffMemberDetails staffMember={mockStaff} onClose={mockOnClose} onEdit={mockOnEdit} onToggleSuccess={mockOnToggleSuccess} />);

        await userEvent.click(screen.getByRole('button', { name: 'close' }));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deve chamar o serviço toggleStatus e onToggleSuccess para DESATIVAR', async () => {
        const mockUpdated = { ...mockStaff, isActive: false };
        mockToggleStatus.mockResolvedValue(mockUpdated);

        render(<StaffMemberDetails staffMember={mockStaff} onClose={mockOnClose} onEdit={mockOnEdit} onToggleSuccess={mockOnToggleSuccess} />);

        const toggleButton = screen.getByRole('button', { name: 'staffMembers.toggle' });
        await userEvent.click(toggleButton);

        expect(mockNotifyLoading).toHaveBeenCalledWith('staffMembers.deactivating');
        expect(mockToggleStatus).toHaveBeenCalledWith('M001');

        await waitFor(() => {
            expect(mockNotifySuccess).toHaveBeenCalledWith('staffMembers.deactivateSuccess');
        });

        expect(mockOnToggleSuccess).toHaveBeenCalledWith(mockUpdated);
    });

    it('deve chamar o serviço toggleStatus e onToggleSuccess para ATIVAR', async () => {
        const inactiveStaff = { ...mockStaff, isActive: false };
        const mockUpdated = { ...mockStaff, isActive: true };
        mockToggleStatus.mockResolvedValue(mockUpdated);

        render(<StaffMemberDetails staffMember={inactiveStaff} onClose={mockOnClose} onEdit={mockOnEdit} onToggleSuccess={mockOnToggleSuccess} />);

        const toggleButton = screen.getByRole('button', { name: 'staffMembers.toggle' });
        await userEvent.click(toggleButton);

        expect(mockNotifyLoading).toHaveBeenCalledWith('staffMembers.activating');

        await waitFor(() => {
            expect(mockNotifySuccess).toHaveBeenCalledWith('staffMembers.activateSuccess');
        });

        expect(mockOnToggleSuccess).toHaveBeenCalledWith(mockUpdated);
    });
});
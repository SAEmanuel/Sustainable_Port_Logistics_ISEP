import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from '@testing-library/react';
import StaffMemberCreateModal from '../../components/StaffMemberCreateModal';
import * as service from '../../services/staffMemberService';
import * as qService from '../../../qualifications/services/qualificationService';
import * as notify from '../../../../utils/notify';
import userEvent from '@testing-library/user-event';
import type { Qualification } from '../../../qualifications/domain/qualification';

const mockCreateStaffMember = vi.spyOn(service, 'createStaffMember');
const mockGetQualifications = vi.spyOn(qService, 'getQualifications');
const mockNotifyError = vi.spyOn(notify, 'notifyError');
const mockNotifyLoading = vi.spyOn(notify, 'notifyLoading');
const mockNotifySuccess = vi.spyOn(notify, 'notifySuccess');

vi.mock('react-hot-toast', () => ({
    default: {
        dismiss: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        success: vi.fn(),
    },
}));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));


describe('StaffMemberCreateModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockQualifications: Qualification[] = [
        { id: 'Q1', code: 'A', name: 'Qual A' },
        { id: 'Q2', code: 'B', name: 'Qual B' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetQualifications.mockResolvedValue(mockQualifications);
    });

    it('deve carregar as qualificações na inicialização', async () => {
        render(<StaffMemberCreateModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        expect(mockGetQualifications).toHaveBeenCalledTimes(1);
        await screen.findByText('A'); // Usa findBy para esperar que o fetch acabe
        expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('deve exibir erro se os campos obrigatórios estiverem vazios', async () => {
        render(<StaffMemberCreateModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        await screen.findByText('A');

        const saveButton = screen.getByRole('button', { name: 'staffMembers.create' });
        await userEvent.click(saveButton);

        expect(mockNotifyError).toHaveBeenCalledWith('staffMembers.nameRequired');

        await userEvent.type(screen.getByPlaceholderText('staffMembers.form.namePlaceholder'), 'Valid Name');
        await userEvent.type(screen.getByPlaceholderText('staffMembers.form.emailPlaceholder'), 'valid@email.com');
        await userEvent.type(screen.getByPlaceholderText('staffMembers.form.phonePlaceholder'), '123456789');
        await userEvent.click(saveButton);

        expect(mockNotifyError).toHaveBeenCalledWith('staffMembers.selectAtLeastOneDay');
    });

    it('deve criar o StaffMember com sucesso e chamar onSuccess', async () => {
        const mockCreated = { id: 'new-id', shortName: 'New Staff', email: 'a@b.com', mecanographicNumber: 'M100', schedule: { shift: 'Morning', daysOfWeek: '0000001' }, isActive: true, qualificationCodes: ['A'] };
        mockCreateStaffMember.mockResolvedValue(mockCreated as any);

        render(<StaffMemberCreateModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        await screen.findByText('A');

        await userEvent.type(screen.getByPlaceholderText('staffMembers.form.namePlaceholder'), 'Test Staff');
        await userEvent.type(screen.getByPlaceholderText('staffMembers.form.emailPlaceholder'), 'test@test.com');
        await userEvent.type(screen.getByPlaceholderText('staffMembers.form.phonePlaceholder'), '111111111');

        await userEvent.click(screen.getByText('weekDay.Monday').closest('div') as HTMLElement);

        await userEvent.click(screen.getByText('A').closest('div') as HTMLElement);

        const saveButton = screen.getByRole('button', { name: 'staffMembers.create' });
        await userEvent.click(saveButton);

        // Não usamos waitFor, verificamos a chamada após a ação assíncrona
        expect(mockCreateStaffMember).toHaveBeenCalledWith({
            shortName: 'Test Staff',
            email: 'test@test.com',
            phone: '111111111',
            schedule: { shift: 'Morning', daysOfWeek: '0000001' },
            isActive: true,
            qualificationCodes: ['A']
        });

        expect(mockNotifySuccess).toHaveBeenCalledWith('staffMembers.createSuccess');
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCreated);
    });
});
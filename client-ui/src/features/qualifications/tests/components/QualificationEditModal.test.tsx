import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from '@testing-library/react'; // waitFor CORRIGIDO AQUI
import QualificationCreateModal from '../../components/QualificationCreateModal';
import * as service from '../../services/qualificationService';
import userEvent from 'user-event';
import * as notify from '../../../../utils/notify';

const mockCreateQualification = vi.spyOn(service, 'createQualification');
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


describe('QualificationCreateModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve exibir erro se os campos estiverem vazios ao tentar salvar', async () => {
        render(<QualificationCreateModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        const saveButton = screen.getByRole('button', { name: 'qualifications.create' });
        await userEvent.click(saveButton);

        expect(mockNotifyError).toHaveBeenCalledWith('qualifications.createEmptyError');
        expect(mockCreateQualification).not.toHaveBeenCalled();
    });

    it('deve criar a qualificação e chamar onSuccess em caso de sucesso', async () => {
        const mockCreated = { id: 'new-id', code: 'NEW', name: 'New Qual' };
        mockCreateQualification.mockResolvedValue(mockCreated);

        render(<QualificationCreateModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        await userEvent.type(screen.getByPlaceholderText('qualifications.form.codePlaceholder'), 'NEW_CODE');
        await userEvent.type(screen.getByPlaceholderText('qualifications.form.namePlaceholder'), 'New Qualification');

        const saveButton = screen.getByRole('button', { name: 'qualifications.create' });
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(mockCreateQualification).toHaveBeenCalledWith({
                code: 'NEW_CODE',
                name: 'New Qualification',
            });
        });

        expect(mockNotifyLoading).toHaveBeenCalledWith('qualifications.creating');
        expect(mockNotifySuccess).toHaveBeenCalledWith('qualifications.createSuccess');
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCreated);
    });

    it('deve chamar onClose ao clicar no botão de cancelamento', async () => {
        render(<QualificationCreateModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        const cancelButton = screen.getByRole('button', { name: 'qualifications.cancel' });
        await userEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
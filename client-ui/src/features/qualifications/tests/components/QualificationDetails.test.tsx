import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from '@testing-library/react';
import QualificationDetails from '../../components/QualificationDetails';
import type {Qualification} from '../../domain/qualification';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('QualificationDetails', () => {
    const mockQualification: Qualification = { id: '1', code: 'D1', name: 'Detail Qual' };
    const mockOnClose = vi.fn();
    const mockOnEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar o código e nome da qualificação corretamente', () => {
        render(<QualificationDetails qualification={mockQualification} onClose={mockOnClose} onEdit={mockOnEdit} />);

        expect(screen.getByText('D1')).toBeInTheDocument();
        expect(screen.getByText(/Detail Qual/)).toBeInTheDocument();
        expect(screen.getByText('qualifications.details.name:')).toBeInTheDocument();
    });

    it('deve chamar onClose ao clicar no botão de fechar', async () => {
        render(<QualificationDetails qualification={mockQualification} onClose={mockOnClose} onEdit={mockOnEdit} />);

        // CORREÇÃO: Obtém todos os botões e seleciona o primeiro (o botão de fechar)
        const closeButton = screen.getAllByRole('button')[0];
        await userEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onEdit ao clicar no botão de edição', async () => {
        render(<QualificationDetails qualification={mockQualification} onClose={mockOnClose} onEdit={mockOnEdit} />);

        const editButton = screen.getByRole('button', { name: 'qualifications.edit' });
        await userEvent.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
});
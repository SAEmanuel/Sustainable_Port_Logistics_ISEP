import { describe, it, expect, vi } from "vitest";
import { render, screen } from '@testing-library/react';
import QualificationTable from '../../components/QualificationTable';
import type {Qualification} from '../../domain/qualification';
import userEvent from '@testing-library/user-event';


vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('QualificationTable', () => {
    const mockItems: Qualification[] = [
        { id: '1', code: 'Q1', name: 'Qual A' },
        { id: '2', code: 'Q2', name: 'Qual B' },
    ];
    const mockOnSelect = vi.fn();

    it('deve exibir o estado de loading quando loading for true', () => {
        render(<QualificationTable items={[]} loading={true} onSelect={mockOnSelect} />);
        expect(screen.getByText('qualifications.loading')).toBeInTheDocument();
    });

    it('deve exibir a mensagem de lista vazia quando houver 0 itens', () => {
        render(<QualificationTable items={[]} loading={false} onSelect={mockOnSelect} />);
        expect(screen.getByText('qualifications.empty')).toBeInTheDocument();
    });

    it('deve renderizar a tabela com os itens e cabeçalhos corretos', () => {
        render(<QualificationTable items={mockItems} loading={false} onSelect={mockOnSelect} />);

        expect(screen.getByText('qualifications.details.code')).toBeInTheDocument();
        expect(screen.getByText('Qual B')).toBeInTheDocument();

        expect(screen.getAllByRole('row')).toHaveLength(3);
    });

    it('deve chamar onSelect com o objeto correto ao clicar numa linha', async () => {
        render(<QualificationTable items={mockItems} loading={false} onSelect={mockOnSelect} />);

        const row = screen.getByText('Q2').closest('tr');
        await userEvent.click(row as HTMLElement);

        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);
    });
});
import { describe, it, expect, vi } from "vitest";
import { render, screen } from '@testing-library/react';
import StaffMemberTable from '../../components/StaffMemberTable';
import type { StaffMember } from "../../domain/staffMember";
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('StaffMemberTable', () => {
    const mockStaff: StaffMember[] = [
        {
            id: '1',
            mecanographicNumber: 'M001',
            shortName: 'John Doe',
            email: 'johndoe@test.com',
            phone: '123',
            schedule: { shift: 'Morning', daysOfWeek: '0000001' },
            isActive: true,
            qualificationCodes: ['Q1']
        },
        {
            id: '2',
            mecanographicNumber: 'M002',
            shortName: 'Jane Smith',
            email: 'jane.s@test.com',
            phone: '456',
            schedule: { shift: 'Evening', daysOfWeek: '0000100' },
            isActive: true,
            qualificationCodes: ['Q2']
        },
    ];
    const mockOnSelect = vi.fn();

    it('deve exibir o estado de loading quando loading for true', () => {
        render(<StaffMemberTable items={[]} loading={true} onSelect={mockOnSelect} />);
        expect(screen.getByText('staffMembers.loading')).toBeInTheDocument();
    });

    it('deve exibir a mensagem de lista vazia quando houver 0 itens e loading for false', () => {
        render(<StaffMemberTable items={[]} loading={false} onSelect={mockOnSelect} />);
        expect(screen.getByText('staffMembers.empty')).toBeInTheDocument();
    });

    it('deve renderizar a tabela com os dados corretos e cabeçalhos', () => {
        render(<StaffMemberTable items={mockStaff} loading={false} onSelect={mockOnSelect} />);

        expect(screen.getByText('staffMembers.details.mecNumber')).toBeInTheDocument();

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('M002')).toBeInTheDocument();
        expect(screen.getByText('jane.s@test.com')).toBeInTheDocument();

        expect(screen.getAllByRole('row')).toHaveLength(3);
    });

    it('deve chamar onSelect com o StaffMember correto ao clicar numa linha', async () => {
        render(<StaffMemberTable items={mockStaff} loading={false} onSelect={mockOnSelect} />);

        const row = screen.getByText('Jane Smith').closest('tr');
        await userEvent.click(row as HTMLElement);

        expect(mockOnSelect).toHaveBeenCalledWith(mockStaff[1]);
    });
});
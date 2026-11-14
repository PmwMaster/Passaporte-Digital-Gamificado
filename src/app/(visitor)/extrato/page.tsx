import { PointsLedgerService } from '@/modules/points';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function PointsStatementPage() {
  const statement = PointsLedgerService.getStatement();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Saldo Disponível
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {statement.currentPoints} pts
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Total Acumulado
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-goldDark">
            {statement.lifetimePoints} pts
          </p>
        </EditorialCard>
      </div>

      <EditorialCard>
        <h1 className="font-serif text-xl font-bold text-brand-ink">
          Extrato de Pontos
        </h1>
        {statement.transactions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-brand-border bg-brand-ivory p-6 text-center text-xs text-brand-muted">
            Nenhuma movimentação de pontos registrada.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted">
                  <th className="py-3 pr-4">Data</th>
                  <th className="py-3 pr-4">Descrição</th>
                  <th className="py-3 pr-4">Pontos</th>
                  <th className="py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {statement.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 pr-4 text-brand-muted">
                      {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 pr-4 font-medium text-brand-ink">
                      {tx.description}
                    </td>
                    <td
                      className={`py-3 pr-4 font-bold ${
                        tx.type === 'CREDIT' ? 'text-brand-emerald' : 'text-red-700'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? `+${tx.amount}` : `-${tx.amount}`} pts
                    </td>
                    <td className="py-3 text-right font-semibold text-brand-ink">
                      {tx.balanceAfter} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EditorialCard>
    </div>
  );
}

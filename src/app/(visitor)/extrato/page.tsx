import { PointsLedgerService } from '@/modules/points';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function PointsStatementPage() {
  const statement = PointsLedgerService.getStatement();

  return (
    <div>
      <VisitorNavigation currentPath="/extrato" />

      <ModuleHeader
        featureNumber="FUNCIONALIDADE 06"
        title="Sistema de Pontos & Extrato Auditável (Ledger)"
        subtitle="Histórico imutável de créditos, débitos e bônus promocionais com rastreio de origem e saldo resultante após cada operação."
        developerOwner="DESENVOLVEDOR 02"
        moduleName="points"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Saldo Disponível para Resgate
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {statement.currentPoints} pts
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Pontuação Acumulada (Lifetime)
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-goldDark">
            {statement.lifetimePoints} pts
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Integridade Contábil
          </span>
          <p className="mt-1 font-serif text-lg font-bold text-brand-ink">
            Ledger Auditado (ACID)
          </p>
          <span className="text-xs text-brand-muted">
            {statement.transactions.length} movimentações registradas
          </span>
        </EditorialCard>
      </div>

      <EditorialCard>
        <h2 className="font-serif text-2xl font-bold text-brand-ink">
          Extrato de Movimentações (`PointTransaction`)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="py-3 pr-4">Data / Hora</th>
                <th className="py-3 pr-4">Origem</th>
                <th className="py-3 pr-4">Descrição Auditada</th>
                <th className="py-3 pr-4">Movimentação</th>
                <th className="py-3 text-right">Saldo Após</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {statement.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="py-3.5 pr-4 text-brand-muted">
                    {new Date(tx.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="rounded-full bg-brand-ivory px-2.5 py-1 text-[10px] font-semibold uppercase text-brand-goldDark">
                      {tx.origin}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-brand-ink">
                    {tx.description}
                  </td>
                  <td
                    className={`py-3.5 pr-4 font-bold ${
                      tx.type === 'CREDIT' ? 'text-brand-emerald' : 'text-red-700'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? `+${tx.amount}` : `-${tx.amount}`} pts
                  </td>
                  <td className="py-3.5 text-right font-semibold text-brand-ink">
                    {tx.balanceAfter} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EditorialCard>
    </div>
  );
}

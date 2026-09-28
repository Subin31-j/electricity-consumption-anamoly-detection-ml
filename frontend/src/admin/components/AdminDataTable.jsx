import { DataTable } from '../../components/ui/DataTable';

/**
 * Admin table - thin wrapper over the shared DataTable (search / sort /
 * pagination / sticky header). columns: [{ key, header, render?(row) }]
 */
export default function AdminDataTable({ columns, rows, emptyText = 'No records found.', searchable = true, pageSize = 15, ...rest }) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      emptyText={emptyText}
      searchable={searchable}
      sortable
      pageSize={pageSize}
      maxHeight="640px"
      {...rest}
    />
  );
}

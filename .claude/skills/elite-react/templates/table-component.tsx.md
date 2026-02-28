# Table Component Template

TanStack Table with column factory, DataTable, filters, and server pagination.

## Column Definitions (columns.tsx)

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from '@/components/ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui';
import { MoreHorizontal } from 'lucide-react';
import type { {Feature} } from '@/lib/api';
import { DataTableColumnHeader } from '@/components/table';
import { Checkbox } from '@/components/ui';
import { formatDateTime } from '@/utils/date';

export interface ColumnActions {
    onOpen?: ({feature}: {Feature}) => void;
    onEdit?: ({feature}: {Feature}) => void;
    onDelete?: ({feature}: {Feature}) => void;
}

export function createColumns(
    actions: ColumnActions,
): ColumnDef<{Feature}>[] {
    return [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => {
                        table.toggleAllPageRowsSelected(!!value);
                    }}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => {
                        row.toggleSelected(!!value);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue('name')}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue<string>('status');
                return (
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'updatedAt',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated" />
            ),
            cell: ({ row }) => formatDateTime(row.getValue('updatedAt')),
        },
        {
            id: 'actions',
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => {
                const {feature} = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actions.onEdit?.({feature});
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actions.onDelete?.({feature});
                                }}
                                className="text-destructive"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
}
```

## List View with Filters + Server Pagination

```tsx
import type { {Feature} } from '@/lib/api';
import { type ReactElement, useMemo, useState } from 'react';
import {
    FilterBar,
    type FilterChipConfig,
    FilterDropdown,
    type FilterFieldConfig,
    type FilterValues,
    type MultiSelectOption,
} from '@/components/filters';
import { ServerPagination } from '@/components/pagination';
import { DataTable } from '@/components/table';
import {
    type {Feature}QueryParams,
    use{Feature}Query,
} from '@/modules/{feature}/hooks/use{Feature}Query';
import type { ColumnActions } from './columns';
import { createColumns } from './columns';

export interface {Feature}ListViewProps {
    teamKey: string;
    onRowClick?: ({feature}: {Feature}) => void;
}

interface {Feature}FilterValues extends FilterValues {
    status: string[];
}

const DEFAULT_FILTERS: {Feature}FilterValues = {
    status: ['active'],
};

export function {Feature}ListView({
    teamKey,
    onRowClick,
}: {Feature}ListViewProps): ReactElement {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterValues, setFilterValues] = useState<{Feature}FilterValues>(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const columnActions: ColumnActions = useMemo(
        () => ({ onOpen: onRowClick }),
        [onRowClick],
    );

    const columns = useMemo(
        () => createColumns(columnActions),
        [columnActions],
    );

    const queryParams: {Feature}QueryParams = useMemo(
        () => ({
            teamKey,
            status: filterValues.status[0] ?? 'active',
            search: searchQuery || undefined,
            page,
            pageSize,
        }),
        [teamKey, searchQuery, filterValues, page, pageSize],
    );

    const { {featurePlural}, {featurePlural}Count, is{Feature}Loading } =
        use{Feature}Query(queryParams);

    const totalCount = {featurePlural}Count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    function handleSearchChange(query: string): void {
        setSearchQuery(query);
        setPage(1);
    }

    function handleFilterChange(values: {Feature}FilterValues): void {
        setFilterValues(values);
        setPage(1);
    }

    function handlePageChange(newPage: number): void {
        setPage(newPage);
    }

    function handlePageSizeChange(newSize: number): void {
        setPageSize(newSize);
        setPage(1);
    }

    return (
        <div className="flex w-full flex-col gap-6">
            <FilterBar<{Feature}FilterValues>
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search {featurePlural}..."
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                chipConfigs={[]}
            >
                <FilterDropdown
                    fields={[]}
                    values={filterValues}
                    onChange={handleFilterChange}
                />
            </FilterBar>

            <DataTable
                columns={columns}
                data={{featurePlural} ?? []}
                isLoading={is{Feature}Loading}
                onRowClick={onRowClick}
                emptyMessage="No {featurePlural} found."
                pageSize={pageSize}
            />

            <ServerPagination
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
}
```

## Key Patterns

1. **Column factory** - `createColumns(actions)` accepts callback actions
2. **Columns in separate file** - `columns.tsx` next to list view
3. **`e.stopPropagation()`** on action clicks to prevent row click
4. **Server pagination** - page/pageSize state managed by view
5. **Filter reset** - `setPage(1)` on search/filter change
6. **`useMemo`** wraps columns and query params
7. **DataTable** is fully generic `<TData, TValue>`

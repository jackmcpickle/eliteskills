# CRUD List Example

Data table with server pagination, filters, and row actions.

## File Structure

```
src/modules/articles/
├── hooks/
│   ├── useArticlesQuery.ts
│   ├── useDeleteArticleMutation.ts
│   └── useArticleForm.ts
├── schemas/
│   └── article.schema.ts
└── components/
    ├── ArticlesListView.tsx
    ├── columns.tsx
    └── ArticleForm.tsx
```

## hooks/useArticlesQuery.ts

```typescript
import type { Article } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { articleKeys } from '@/utils/queryKeys';

export interface ArticleQueryParams {
    teamKey: string;
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}

interface UseArticlesQueryReturn {
    articles: Article[] | undefined;
    articlesCount: number | undefined;
    isArticlesLoading: boolean;
}

export function useArticlesQuery(
    params: ArticleQueryParams,
): UseArticlesQueryReturn {
    const { data, isPending } = useQuery({
        queryKey: articleKeys.list(params),
        queryFn: async () => api.articles.listArticles(params),
        enabled: Boolean(params.teamKey),
    });

    return {
        articles: data?.items,
        articlesCount: data?.totalCount,
        isArticlesLoading: isPending,
    };
}
```

## components/columns.tsx

```typescript
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button } from '@/components/ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui';
import { MoreHorizontal } from 'lucide-react';
import type { Article } from '@/lib/api';
import { DataTableColumnHeader } from '@/components/table';
import { formatDateTime } from '@/utils/date';

export interface ColumnActions {
    onEdit?: (article: Article) => void;
    onDelete?: (article: Article) => void;
}

export function createColumns(
    actions: ColumnActions,
): ColumnDef<Article>[] {
    return [
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
            accessorKey: 'articleType',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.getValue<string>('articleType')}
                </Badge>
            ),
        },
        {
            accessorKey: 'updatedAt',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated" />
            ),
            cell: ({ row }) =>
                formatDateTime(row.getValue<string>('updatedAt')),
        },
        {
            id: 'actions',
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => {
                const article = row.original;
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
                                    actions.onEdit?.(article);
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    actions.onDelete?.(article);
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

## components/ArticlesListView.tsx

```typescript
import type { Article } from '@/lib/api';
import { type ReactElement, useMemo, useState } from 'react';
import { ServerPagination } from '@/components/pagination';
import { DataTable } from '@/components/table';
import {
    type ArticleQueryParams,
    useArticlesQuery,
} from '@/modules/articles/hooks/useArticlesQuery';
import type { ColumnActions } from './columns';
import { createColumns } from './columns';

export interface ArticlesListViewProps {
    teamKey: string;
    onRowClick?: (article: Article) => void;
    onEdit?: (article: Article) => void;
    onDelete?: (article: Article) => void;
}

export function ArticlesListView({
    teamKey,
    onRowClick,
    onEdit,
    onDelete,
}: ArticlesListViewProps): ReactElement {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const columnActions: ColumnActions = useMemo(
        () => ({ onEdit, onDelete }),
        [onEdit, onDelete],
    );

    const columns = useMemo(
        () => createColumns(columnActions),
        [columnActions],
    );

    const queryParams: ArticleQueryParams = useMemo(
        () => ({
            teamKey,
            search: searchQuery || undefined,
            page,
            pageSize,
        }),
        [teamKey, searchQuery, page, pageSize],
    );

    const { articles, articlesCount, isArticlesLoading } =
        useArticlesQuery(queryParams);

    const totalCount = articlesCount ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    function handleSearchChange(query: string): void {
        setSearchQuery(query);
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
            <DataTable
                columns={columns}
                data={articles ?? []}
                isLoading={isArticlesLoading}
                onRowClick={onRowClick}
                emptyMessage="No articles found."
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

1. **Column factory** - `createColumns(actions)` in separate `columns.tsx`
2. **Server pagination** - page/pageSize managed by view, passed to query
3. **`useMemo` wrapping** - columns, query params, column actions
4. **`e.stopPropagation()`** in action dropdown to prevent row click
5. **Search resets page** - `setPage(1)` when search changes
6. **Query hook** returns renamed state props

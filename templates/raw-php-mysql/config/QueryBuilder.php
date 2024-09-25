<?php
namespace App\Config;

class QueryBuilder {
    protected string $table = '';
    protected array $fields = ['*'];
    protected array $wheres = [];
    protected array $bindings = [];
    protected string $orderBy = '';
    protected ?int $limitNum = null;

    public static function table(string $table): self {
        $qb = new self();
        $qb->table = $table;
        return $qb;
    }

    public function select(array|string $fields = ['*']): self {
        $this->fields = is_array($fields) ? $fields : func_get_args();
        return $this;
    }

    public function where(string $column, mixed $operatorOrValue, mixed $value = null): self {
        if ($value === null) {
            $value = $operatorOrValue;
            $operator = '=';
        } else {
            $operator = $operatorOrValue;
        }

        $paramKey = ":p_" . count($this->bindings);
        $this->wheres[] = "{$column} {$operator} {$paramKey}";
        $this->bindings[$paramKey] = $value;
        return $this;
    }

    public function orderBy(string $column, string $direction = 'ASC'): self {
        $this->orderBy = "ORDER BY {$column} " . strtoupper($direction);
        return $this;
    }

    public function limit(int $limit): self {
        $this->limitNum = $limit;
        return $this;
    }

    public function get(): array {
        $sql = "SELECT " . implode(', ', $this->fields) . " FROM {$this->table}";
        if (!empty($this->wheres)) {
            $sql .= " WHERE " . implode(' AND ', $this->wheres);
        }
        if (!empty($this->orderBy)) {
            $sql .= " {$this->orderBy}";
        }
        if ($this->limitNum !== null) {
            $sql .= " LIMIT {$this->limitNum}";
        }

        return Database::query($sql, $this->bindings);
    }

    public function first(): ?array {
        $this->limit(1);
        $results = $this->get();
        return $results[0] ?? null;
    }

    public function insert(array $data): bool {
        $columns = implode(', ', array_keys($data));
        $placeholders = [];
        $params = [];

        foreach ($data as $k => $v) {
            $param = ":ins_{$k}";
            $placeholders[] = $param;
            $params[$param] = $v;
        }

        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES (" . implode(', ', $placeholders) . ")";
        return Database::execute($sql, $params);
    }

    public function update(array $data): bool {
        $sets = [];
        $params = [];

        foreach ($data as $k => $v) {
            $param = ":upd_{$k}";
            $sets[] = "{$k} = {$param}";
            $params[$param] = $v;
        }

        $sql = "UPDATE {$this->table} SET " . implode(', ', $sets);
        if (!empty($this->wheres)) {
            $sql .= " WHERE " . implode(' AND ', $this->wheres);
            $params = array_merge($params, $this->bindings);
        }

        return Database::execute($sql, $params);
    }

    public function delete(): bool {
        $sql = "DELETE FROM {$this->table}";
        if (!empty($this->wheres)) {
            $sql .= " WHERE " . implode(' AND ', $this->wheres);
        }
        return Database::execute($sql, $this->bindings);
    }
}

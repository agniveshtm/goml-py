package ast

type Node interface {
	nodeType() string
}

type Document struct {
	Statements []Node
	Line       int
	Col        int
}

func (d *Document) nodeType() string { return "Document" }

type Comment struct {
	Text string
	Line int
	Col  int
}

func (c *Comment) nodeType() string { return "Comment" }

type KeyValue struct {
	Key   string
	Value Node
	Line  int
	Col   int
}

func (kv *KeyValue) nodeType() string { return "KeyValue" }

type Object struct {
	Entries []Node
	Line    int
	Col     int
}

func (o *Object) nodeType() string { return "Object" }

type Array struct {
	Items []Node
	Line  int
	Col   int
}

func (a *Array) nodeType() string { return "Array" }

type StringVal struct {
	Value string
	Line  int
	Col   int
}

func (s *StringVal) nodeType() string { return "String" }

type NumberVal struct {
	Value    string
	IsFloat  bool
	FloatVal float64
	IntVal   int
	Line     int
	Col      int
}

func (n *NumberVal) nodeType() string { return "Number" }

type BoolVal struct {
	Value bool
	Line  int
	Col   int
}

func (b *BoolVal) nodeType() string { return "Boolean" }

type NullVal struct {
	Line int
	Col  int
}

func (n *NullVal) nodeType() string { return "Null" }

type Reference struct {
	Path string
	Line int
	Col  int
}

func (r *Reference) nodeType() string { return "Reference" }

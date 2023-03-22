(function(){
    class MathSet extends Set {
        constructor(...elements) {
            if (elements.length < 2 && 'function' === typeof (elements[0] ?? [])[Symbol.iterator]) super(...elements);
            else super(elements);
        }

        insert (...elements) {
            /* Insert new elements into the set */
            elements = new MathSet(...elements);
            for (let e of elements) this.add(e);
            return this;
        }

        remove (...elements) {
            /* Remove elements from the set */
            elements = new MathSet(...elements);
            for (let e of elements) this.delete(e);
            return this;
        }
        
        union (...elements) {
            /* Returns the union of this Set and another Set with {...elements} */
            let res = new MathSet(this);
            if (elements.length < 1) return res;
            let B = new MathSet(...elements);
            for (let i of B) res.add(i);
            return res;
        }
        
        intersection (...elements) {
            /* Returns the intersection of this Set and another Set with {...elements} */
            let res = new MathSet();
            if (this.size == 0 || elements.length < 1) return res;
            let B = new MathSet(...elements);
            for (let i of B) {
                if (this.has(i)) res.add(i);
            }
            return res;
        }
        
        #permuRecursive (data, original, indices, numOfElements) {
            /* Handle function for permutations counter, using recursion */
            if (indices.length >= numOfElements) return data.add(new MathSet(indices.map(e => original[e])));
            for (let i = (indices.at(-1) + 1) || 0; i < original.length; ++i) this.#permuRecursive(data, original, indices.concat(i), numOfElements);
        }
        
        permute (...counts) {
            /* Returns a Set containing all permutations from current Set, with given number of elements at <...counts> */
            let res = new MathSet();
            let ideal = [...new Array(this.size + 1)].map((e, i) => i);
            if (counts.length == 0) counts = ideal;
            else counts = new Set(counts);
            for (let i of counts) (ideal.includes(i) && this.#permuRecursive(res, [...this], [], i));
            return res;
        }

        #fact (n) {
            /* Custom factorial function to calculate n! */
            return n < 2 ? 1 : n * this.#fact(n - 1);
        }

        permutationCount (...counts) {
            /* Returns number of permutations from current Set, with given number of elements at <...counts> */
            if (counts.length == 0) return 1 << this.size;
            let ideal = [...new Array(this.size + 1)].map((e, i) => i);
            let pCount = 0;
            counts = new Set(counts);
            for (let i of counts) pCount += ideal.includes(i) && (this.#fact(this.size) / (this.#fact(i) * this.#fact(this.size - i)));
            return pCount;
        }

        isSuperset (...elements) {
            /* Check if this Set is a superset of Set {...elements} */
            if (elements.length < 1) return true;
            let B = new MathSet(...elements);
            for (let i of B) {
                if (!this.has(i)) return false;
            }
            return true;
        }

        isSubset (...elements) {
            /* Check if this Set is a subset of Set {...elements} */
            return elements.length < 1 ? false : new MathSet(...elements).isSuperset(this);
        }

        equals (...elements) {
            /* Check if this Set equals Set {...elements} */
            return new MathSet(...elements).size === this.size && this.hasSubset(...elements);
        }

        difference (...elements) {
            /* Returns a Set of elements that exists in this Set but not in {...elements} */
            let res = new MathSet(this);
            if (elements.length < 1) return res;
            let B = new MathSet(...elements);
            for (let i of B) {
                if (this.has(i)) res.delete(i);
            }
            return res;
        }

        random (count) {
            if ("number" != typeof count || count < 0 || count != Math.trunc(count)) throw new TypeError("Invalid elements count");
            /* Random an element <count> times from current set */
            let elements = [...this], res = [];
            for (let i = 0; i < count; ++i) res.push(elements[Math.floor(Math.random() * elements.length)]);
            return res;
        }

        randomOnce () {
            /* Random an element from current set */
            return this.random(1)[0];
        }
    }

    if (window) Math.Set = MathSet;
    else module.exports = MathSet;
})();
(function(){
    class MathSet extends Set {
        constructor(...args) {
            switch (args.length) {
                case 0: super([]); break;
                case 1:
                    try { super(args[0]) } catch (e) { super([args[0]]) };
                    break;
                default: super(args);
            }
        }
        
        unionize (...B) {
            if (B.length < 1) return new MathSet(this);
            let res = new MathSet(...this);
            let newB = new MathSet(...B);
            for (let i of newB) res.add(i);
            return res;
        }
        
        intersect (...B) {
            let res = new MathSet();
            if (this.size == 0 || B.length < 1) return res;
            let newB = new MathSet(...B);
            for (let i of newB) {
                if (this.has(i)) res.add(i);
            }
            return res;
        }
        
        #permuRecursive (data, original, indices, numOfElements) {
            if (indices.length >= numOfElements) return data.add(new MathSet(indices.map(e => original[e])));
            for (let i = (indices.at(-1) + 1) || 0; i < original.length; ++i) this.#permuRecursive(data, original, indices.concat(i), numOfElements);
        }
        
        permute (...counts) {
            let res = new MathSet();
            let ideal = [...new Array(this.size + 1)].map((e, i) => i);
            if (counts.length == 0) counts = ideal;
            else counts = counts.filter(e => ideal.includes(e))
            for (let i of counts) this.#permuRecursive(res, [...this], [], i);
            return res;
        }
    }

    if (window) Math.Set = MathSet;
    else module.exports = MathSet;
})();

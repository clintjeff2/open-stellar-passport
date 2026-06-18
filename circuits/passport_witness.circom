pragma circom 2.2.2;

// Helper circuit (NOT for production proving).
// Given the private inputs, it OUTPUTS the registryRoot and nullifierHash that
// the real AgentPassport circuit expects as public inputs — computed with the
// exact same Poseidon2 / MerkleProof, so we can build valid test witnesses
// without re-implementing Poseidon2 off-circuit.

include "./lib/keypair.circom";
include "./lib/merkleProof.circom";
include "./lib/poseidon2/poseidon2_hash.circom";

template PassportWitness(levels) {
    signal input privateKey;
    signal input agentId;
    signal input pathElements[levels];
    signal input pathIndices;

    signal output registryRoot;
    signal output nullifierHash;
    signal output publicKey;

    component kp = Keypair();
    kp.privateKey <== privateKey;
    publicKey <== kp.publicKey;

    component tree = MerkleProof(levels);
    tree.leaf <== kp.publicKey;
    tree.pathIndices <== pathIndices;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
    }
    registryRoot <== tree.root;

    component nf = Poseidon2(2);
    nf.inputs[0] <== privateKey;
    nf.inputs[1] <== agentId;
    nf.domainSeparation <== 0x05;
    nullifierHash <== nf.out;
}

component main = PassportWitness(20);

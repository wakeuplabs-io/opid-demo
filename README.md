
# OPID Zk Erc20 Airdrop Demo

Demo to showcase the usage of the Optimism Zk Identity kit. 

In this case we showcase an airdrop workflow using the Selective Disclosure verifier and the Issuer Node. The idea is users can come to the website, issue a KycAge credential for them and later claim the Airdrop. A small demo here:

<video controls>
  <source src="./readme-assets/demo.mp4" type="video/mp4">
</video>

The contracts used for this demo can be found here: https://github.com/wakeuplabs-io/opid-contracts-examples


## Notes

Just for demo porpoises we made the following simplifications
- Website directly reaches the issuer node with admin credentials and publishes the state. This means any user can claim they're worthy even if they're not. In a real production case the issuer would restrict the issuance and run the proper checks to certify the user claims. Not a system requirement but just to reinforce verifiers trust on the credential itself.
- Identity wallet is created locally and there's no recovery flow. In a real production case users would need to keep their identity safe. 

# React Monorepo Template

## Node and PNPM version

- Node version: 18.18.2
- pnpm version: 9.12.1

## Create user for deployment (AWS)

1. Go to IAM service
2. Click Users --> `Create User`

   ![image info](readme-assets/create-user.png)

3. Fill the user name and click on `Next`
4. Click `Attach policies directly`, click on `AdministratorAccess` and click on `Next`
5. Click on `Create user`
6. View the created user.
7. Click on the tab `Security credentials` and click on `Create access key`
8. Click on the option `Command Line Interface (CLI)` and click on `Next`
9. Click on the button `Create access key`
10. Copy the keys `Access key` and `Secret access key`
